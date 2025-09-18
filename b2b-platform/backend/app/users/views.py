from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
import random
import string

from .models import Favorite, SearchHistory
from .serializers import (FavoriteSerializer, SearchHistorySerializer,
                          UserRegistrationSerializer, UserSerializer)

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            # Get the created user
            user = User.objects.get(email=request.data.get("email"))

            # Generate JWT tokens for immediate authentication
            from rest_framework_simplejwt.tokens import RefreshToken

            refresh = RefreshToken.for_user(user)

            # Return user data with tokens for auto-login
            response.data = {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "message": "Регистрация прошла успешно. Добро пожаловать!"
            }
        return response


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data.get("email"))
            response.data["user"] = UserSerializer(user).data
        return response


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def toggle_favorite(request, company_id):
    try:
        from app.companies.models import Company

        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        return Response(
            {"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND
        )

    favorite, created = Favorite.objects.get_or_create(
        user=request.user, company=company
    )

    if not created:
        favorite.delete()
        return Response(
            {"message": "Removed from favorites"}, status=status.HTTP_200_OK
        )

    return Response({"message": "Added to favorites"}, status=status.HTTP_201_CREATED)


class FavoriteListView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)


class SearchHistoryListCreateView(generics.ListCreateAPIView):
    serializer_class = SearchHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SearchHistory.objects.filter(user=self.request.user)[
            :20
        ]  # Last 20 searches

    def perform_create(self, serializer):
        # Check if this search already exists for the user
        query = serializer.validated_data.get("query")
        category = serializer.validated_data.get("category", "")
        location = serializer.validated_data.get("location", "")

        # Update or create search history
        search_history, created = SearchHistory.objects.get_or_create(
            user=self.request.user,
            query=query,
            category=category,
            location=location,
            defaults={},
        )

        # If it already exists, update the created_at timestamp
        if not created:
            search_history.save()  # This will update the timestamp


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def clear_search_history(request):
    SearchHistory.objects.filter(user=request.user).delete()
    return Response({"message": "Search history cleared"}, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def delete_search_item(request, search_id):
    try:
        search_item = SearchHistory.objects.get(id=search_id, user=request.user)
        search_item.delete()
        return Response({"message": "Search item deleted"}, status=status.HTTP_200_OK)
    except SearchHistory.DoesNotExist:
        return Response(
            {"error": "Search item not found"}, status=status.HTTP_404_NOT_FOUND
        )


def generate_reset_code():
    """Генерирует 6-значный код для сброса пароля"""
    return ''.join(random.choices(string.digits, k=6))


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_reset_code(request):
    """Отправляет код для сброса пароля на email"""
    email = request.data.get('email')

    if not email:
        return Response(
            {'error': 'Email обязателен'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Пользователь с таким email не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Генерируем код и сохраняем в кэше на 10 минут
    reset_code = generate_reset_code()
    cache_key = f'reset_code_{email}'
    cache.set(cache_key, reset_code, 600)  # 10 минут

    # Отправляем email с кодом
    try:
        send_mail(
            subject='Код восстановления пароля - ORBIZ.ASIA',
            message=f'''
Здравствуйте!

Вы запросили восстановление пароля для вашего аккаунта на ORBIZ.ASIA.

Ваш код подтверждения: {reset_code}

Код действителен в течение 10 минут.

Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.

С уважением,
Команда ORBIZ.ASIA
            ''',
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@orbiz.asia'),
            recipient_list=[email],
            fail_silently=False,
        )

        # В режиме разработки (console backend) добавляем информацию для тестирования
        if getattr(settings, 'EMAIL_BACKEND', '') == 'django.core.mail.backends.console.EmailBackend':
            print(f"[ДЕМОНСТРАЦИЯ] Код восстановления для {email}: {reset_code}")

        return Response(
            {'message': 'Код отправлен на вашу почту'},
            status=status.HTTP_200_OK
        )

    except Exception as e:
        # В случае ошибки SMTP (например, не настроен пароль приложения)
        print(f"Email send error: {e}")
        print(f"[ДЕМОНСТРАЦИЯ] Код восстановления для {email}: {reset_code}")

        return Response(
            {'message': 'Код отправлен на вашу почту'},
            status=status.HTTP_200_OK
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_reset_code(request):
    """Проверяет код сброса пароля"""
    email = request.data.get('email')
    code = request.data.get('code')

    if not email or not code:
        return Response(
            {'error': 'Email и код обязательны'},
            status=status.HTTP_400_BAD_REQUEST
        )

    cache_key = f'reset_code_{email}'
    stored_code = cache.get(cache_key)

    if not stored_code or stored_code != code:
        return Response(
            {'error': 'Неверный или истёкший код'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Код верный, создаем токен для сброса пароля (действует 30 минут)
    reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    reset_cache_key = f'reset_token_{email}'
    cache.set(reset_cache_key, reset_token, 1800)  # 30 минут

    # Удаляем использованный код
    cache.delete(cache_key)

    return Response(
        {'reset_token': reset_token},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password(request):
    """Сбрасывает пароль пользователя"""
    email = request.data.get('email')
    reset_token = request.data.get('reset_token')
    new_password = request.data.get('password')

    if not email or not reset_token or not new_password:
        return Response(
            {'error': 'Email, токен и новый пароль обязательны'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(new_password) < 8:
        return Response(
            {'error': 'Пароль должен содержать минимум 8 символов'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Проверяем токен
    reset_cache_key = f'reset_token_{email}'
    stored_token = cache.get(reset_cache_key)

    if not stored_token or stored_token != reset_token:
        return Response(
            {'error': 'Неверный или истёкший токен'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()

        # Удаляем использованный токен
        cache.delete(reset_cache_key)

        return Response(
            {'message': 'Пароль успешно изменён'},
            status=status.HTTP_200_OK
        )

    except User.DoesNotExist:
        return Response(
            {'error': 'Пользователь не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

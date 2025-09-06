from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

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

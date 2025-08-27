from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import UserRegistrationSerializer, UserSerializer, FavoriteSerializer
from .models import Favorite

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data.get('email'))
            response.data['user'] = UserSerializer(user).data
        return response


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_favorite(request, company_id):
    try:
        from app.companies.models import Company
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        return Response({'error': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)
    
    favorite, created = Favorite.objects.get_or_create(
        user=request.user, 
        company=company
    )
    
    if not created:
        favorite.delete()
        return Response({'message': 'Removed from favorites'}, status=status.HTTP_200_OK)
    
    return Response({'message': 'Added to favorites'}, status=status.HTTP_201_CREATED)


class FavoriteListView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)
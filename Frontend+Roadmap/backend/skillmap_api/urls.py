from django.urls import path
from . import views

urlpatterns = [
    path('api/analyze/', views.analyze, name='analyze'),
    path('api/health/',  views.health,   name='health'),
]

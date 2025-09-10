from django.contrib import admin
from .models import Board, Column, Card ,AuditLog

# Register your models here so they appear in the admin panel
admin.site.register(Board)
admin.site.register(Column)
admin.site.register(Card)
admin.site.register(AuditLog)
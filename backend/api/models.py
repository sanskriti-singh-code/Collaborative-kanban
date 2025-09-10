from django.db import models

class Board(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Column(models.Model):
    title = models.CharField(max_length=255)
    board = models.ForeignKey(Board, related_name='columns', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0) # To maintain column order

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

class Card(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    column = models.ForeignKey(Column, related_name='cards', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0) # To maintain card order within a column
    due_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title
    
class AuditLog(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp'] # Show the newest logs first

    def __str__(self):
        return f'{self.action} on Board "{self.board.name}" at {self.timestamp.strftime("%Y-%m-%d %H:%M")}'
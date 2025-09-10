from rest_framework import viewsets
from .models import Board, Column, Card, AuditLog
from .serializers import BoardSerializer, ColumnSerializer, CardSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class BoardViewSet(viewsets.ModelViewSet):
    queryset = Board.objects.all()
    serializer_class = BoardSerializer

class ColumnViewSet(viewsets.ModelViewSet):
    queryset = Column.objects.all()
    serializer_class = ColumnSerializer

class CardViewSet(viewsets.ModelViewSet):
    queryset = Card.objects.all()
    serializer_class = CardSerializer

    def perform_create(self, serializer):
        card = serializer.save()
        board = card.column.board
        channel_layer = get_channel_layer()

        # Create Audit Log for card creation
        AuditLog.objects.create(
            board=board,
            action="Card Created",
            details=f'Card "{card.title}" was created in column "{card.column.title}".'
        )
        
        # Broadcast WebSocket message
        async_to_sync(channel_layer.group_send)(
            f'board_{board.id}',
            {'type': 'board_update', 'message': f'New card "{card.title}" was added!'}
        )

    def perform_update(self, serializer):
        old_card = self.get_object()
        old_column_title = old_card.column.title
        
        new_card = serializer.save()
        board = new_card.column.board
        channel_layer = get_channel_layer()
        
        # Create a detailed Audit Log for card updates/moves
        details = f'Card "{new_card.title}" was updated.'
        if new_card.column.title != old_column_title:
            details = f'Card "{new_card.title}" was moved from "{old_column_title}" to "{new_card.column.title}".'

        AuditLog.objects.create(
            board=board,
            action="Card Updated",
            details=details
        )
        
        # Broadcast WebSocket message
        async_to_sync(channel_layer.group_send)(
            f'board_{board.id}',
            {'type': 'board_update', 'message': f'Card "{new_card.title}" was updated!'}
        )

    def perform_destroy(self, instance):
        board = instance.column.board
        card_title = instance.title
        column_title = instance.column.title
        channel_layer = get_channel_layer()
        
        # Create Audit Log before deleting
        AuditLog.objects.create(
            board=board,
            action="Card Deleted",
            details=f'Card "{card_title}" was deleted from column "{column_title}".'
        )

        # Delete the instance from the database
        instance.delete()

        # Broadcast WebSocket message
        async_to_sync(channel_layer.group_send)(
            f'board_{board.id}',
            {'type': 'board_update', 'message': f'Card "{card_title}" was deleted!'}
        )
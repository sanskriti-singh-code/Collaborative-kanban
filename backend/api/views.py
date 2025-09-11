from rest_framework import viewsets
from .models import Board, Column, Card, AuditLog
from .serializers import BoardSerializer, ColumnSerializer, CardSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

def broadcast_event(board_id, event_type, data):
    """Helper function to broadcast events to a board group."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'board_{board_id}',
        {
            'type': 'broadcast_event',
            'event': {
                'type': event_type,
                'payload': data
            }
        }
    )

class BoardViewSet(viewsets.ModelViewSet):
    queryset = Board.objects.all()
    serializer_class = BoardSerializer

    def perform_update(self, serializer):
        board = serializer.save()
        broadcast_event(board.id, 'BOARD_UPDATED', serializer.data)

class ColumnViewSet(viewsets.ModelViewSet):
    queryset = Column.objects.all()
    serializer_class = ColumnSerializer

    def perform_create(self, serializer):
        column = serializer.save()
        broadcast_event(column.board.id, 'COLUMN_CREATED', serializer.data)

    def perform_destroy(self, instance):
        board_id = instance.board.id
        column_id = instance.id
        instance.delete()
        broadcast_event(board_id, 'COLUMN_DELETED', {'columnId': column_id})


class CardViewSet(viewsets.ModelViewSet):
    queryset = Card.objects.all()
    serializer_class = CardSerializer

    def perform_create(self, serializer):
        card = serializer.save()
        broadcast_event(card.column.board.id, 'CARD_CREATED', serializer.data)

    def perform_update(self, serializer):
        card = serializer.save()
        broadcast_event(card.column.board.id, 'CARD_UPDATED', serializer.data)

    def perform_destroy(self, instance):
        board_id = instance.column.board.id
        card_id = instance.id
        column_id = instance.column.id
        instance.delete()
        broadcast_event(board_id, 'CARD_DELETED', {'cardId': card_id, 'columnId': column_id})
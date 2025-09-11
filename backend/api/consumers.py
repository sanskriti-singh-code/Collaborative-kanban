import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from django.core.cache import cache
from urllib.parse import parse_qs

class BoardConsumer(WebsocketConsumer):
    def connect(self):
        self.board_id = self.scope['url_route']['kwargs']['board_id']
        self.board_group_name = f'board_{self.board_id}'
        
        query_string = parse_qs(self.scope['query_string'].decode())
        self.username = query_string.get('username', [None])[0]

        async_to_sync(self.channel_layer.group_add)(
            self.board_group_name,
            self.channel_name
        )
        self.accept()

        if self.username:
            online_users = cache.get(self.board_group_name, set())
            online_users.add(self.username)
            cache.set(self.board_group_name, online_users)
            async_to_sync(self.channel_layer.group_send)(
                self.board_group_name,
                { 'type': 'broadcast_event', 'event': {'type': 'PRESENCE_UPDATE', 'payload': {'users': list(online_users)}}}
            )

    def disconnect(self, close_code):
        if self.username:
            online_users = cache.get(self.board_group_name, set())
            online_users.discard(self.username)
            cache.set(self.board_group_name, online_users)
            async_to_sync(self.channel_layer.group_send)(
                self.board_group_name,
                { 'type': 'broadcast_event', 'event': {'type': 'PRESENCE_UPDATE', 'payload': {'users': list(online_users)}}}
            )

        async_to_sync(self.channel_layer.group_discard)(
            self.board_group_name,
            self.channel_name
        )

    # Receives event from a group and sends it to the WebSocket
    def broadcast_event(self, event_data):
        self.send(text_data=json.dumps(event_data['event']))
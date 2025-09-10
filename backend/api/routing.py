from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # This regex matches a URL like ws://.../ws/board/1/
    re_path(r'ws/board/(?P<board_id>\w+)/$', consumers.BoardConsumer.as_asgi()),
]
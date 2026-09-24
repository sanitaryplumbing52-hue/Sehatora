from django.contrib.contenttypes.models import ContentType


def log_activity(obj, activity_type, title, description="", actor=None, metadata=None):
    from apps.activities.models import Activity

    return Activity.objects.create(
        organization=obj.organization,
        content_type=ContentType.objects.get_for_model(obj.__class__),
        object_id=obj.id,
        activity_type=activity_type,
        title=title,
        description=description,
        metadata=metadata or {},
        actor=actor,
        created_by=actor,
        updated_by=actor,
    )


def get_timeline_for(obj):
    from apps.activities.models import Activity

    return Activity.all_objects.filter(
        organization=obj.organization,
        content_type=ContentType.objects.get_for_model(obj.__class__),
        object_id=obj.id,
    ).select_related("actor").order_by("-created_at")


def notify(user, notification_type, title, body="", url=""):
    """Creates a Notification row and pushes it over the user's WebSocket
    group in real time (apps.activities.consumers.NotificationConsumer)."""
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer

    from apps.activities.models import Notification
    from apps.activities.serializers import NotificationSerializer

    notification = Notification.objects.create(
        organization=user.organization,
        recipient=user,
        notification_type=notification_type,
        title=title,
        body=body,
        url=url,
        created_by=user,
        updated_by=user,
    )

    try:
        channel_layer = get_channel_layer()
        if channel_layer is not None:
            async_to_sync(channel_layer.group_send)(
                f"user_{user.id}_notifications",
                {"type": "notify", "payload": NotificationSerializer(notification).data},
            )
    except Exception:
        # The notification row is already saved; a WebSocket/Redis hiccup
        # should never fail the request that triggered it (lead created,
        # deal won, etc.) -- the client falls back to polling /notifications/.
        pass
    return notification

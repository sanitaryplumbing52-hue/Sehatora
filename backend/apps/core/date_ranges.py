import datetime

from django.utils import timezone


def resolve_range(request):
    """Turns ?range=last_7_days (or ?start=&end=) into a (start, end) tuple
    of timezone-aware datetimes, defaulting to the last 30 days."""
    now = timezone.localtime()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    range_key = request.query_params.get("range", "last_30_days")

    if range_key == "custom":
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        start_dt = timezone.make_aware(datetime.datetime.fromisoformat(start)) if start else today_start - datetime.timedelta(days=30)
        end_dt = timezone.make_aware(datetime.datetime.fromisoformat(end)) if end else now
        return start_dt, end_dt

    ranges = {
        "today": (today_start, now),
        "yesterday": (today_start - datetime.timedelta(days=1), today_start),
        "last_7_days": (today_start - datetime.timedelta(days=7), now),
        "last_30_days": (today_start - datetime.timedelta(days=30), now),
        "this_month": (today_start.replace(day=1), now),
        "last_month": _last_month(today_start),
    }
    return ranges.get(range_key, ranges["last_30_days"])


def _last_month(today_start):
    first_of_this_month = today_start.replace(day=1)
    last_month_end = first_of_this_month
    last_month_start = (first_of_this_month - datetime.timedelta(days=1)).replace(day=1)
    return last_month_start, last_month_end

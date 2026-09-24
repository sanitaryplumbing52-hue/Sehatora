import datetime

from django.db.models import Count, Sum
from django.db.models.functions import TruncDay
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.date_ranges import resolve_range


def _series_by_day(queryset, date_field, start, end):
    rows = (
        queryset.filter(**{f"{date_field}__gte": start, f"{date_field}__lte": end})
        .annotate(day=TruncDay(date_field))
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )
    return [{"date": row["day"].date().isoformat(), "count": row["count"]} for row in rows]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    from apps.contacts.models import Contact
    from apps.core import context
    from apps.deals.models import Deal
    from apps.leads.models import Lead
    from apps.tasks.models import Task

    org = request.user.organization
    context.set_current_organization(org)
    start, end = resolve_range(request)
    now = timezone.localtime()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + datetime.timedelta(days=1)

    contacts = Contact.all_objects.filter(organization=org)
    leads = Lead.all_objects.filter(organization=org)
    deals = Deal.all_objects.filter(organization=org)
    tasks = Task.all_objects.filter(organization=org)

    leads_in_range = leads.filter(created_at__gte=start, created_at__lte=end)
    deals_in_range = deals.filter(created_at__gte=start, created_at__lte=end)

    open_deals = deals.exclude(stage__is_won=True).exclude(stage__is_lost=True)
    won_deals = deals.filter(stage__is_won=True, closed_at__gte=start, closed_at__lte=end)
    lost_deals = deals.filter(stage__is_lost=True, closed_at__gte=start, closed_at__lte=end)

    pipeline_value = open_deals.aggregate(total=Sum("amount"))["total"] or 0
    revenue = won_deals.aggregate(total=Sum("amount"))["total"] or 0

    total_leads_in_range = leads_in_range.count()
    won_in_range = deals_in_range.filter(stage__is_won=True).count()
    conversion_rate = round((won_in_range / total_leads_in_range) * 100, 1) if total_leads_in_range else 0

    stats = {
        "total_contacts": contacts.count(),
        "new_leads": total_leads_in_range,
        "qualified_leads": leads_in_range.filter(status="qualified").count(),
        "open_deals": open_deals.count(),
        "pipeline_value": pipeline_value,
        "won_deals": won_deals.count(),
        "lost_deals": lost_deals.count(),
        "revenue": revenue,
        "tasks_due_today": tasks.filter(due_date__gte=today_start, due_date__lt=today_end)
        .exclude(status__in=["completed", "cancelled"])
        .count(),
        "upcoming_meetings": tasks.filter(task_type="meeting", due_date__gte=now)
        .exclude(status__in=["completed", "cancelled"])
        .count(),
        "email_activity": 0,  # populated once the Email module (Phase 2) ships
        "whatsapp_activity": 0,  # populated once the WhatsApp module (Phase 2) ships
        "website_visitors": 0,  # populated once Website Tracking (Phase 2) ships
        "conversion_rate": conversion_rate,
    }

    pipeline_stages = []
    from apps.deals.models import Pipeline

    default_pipeline = Pipeline.all_objects.filter(organization=org, is_default=True).first() or Pipeline.all_objects.filter(
        organization=org
    ).first()
    if default_pipeline:
        for stage in default_pipeline.stages.order_by("order"):
            stage_deals = stage.deals.all()
            pipeline_stages.append(
                {
                    "stage": stage.name,
                    "count": stage_deals.count(),
                    "value": stage_deals.aggregate(total=Sum("amount"))["total"] or 0,
                }
            )

    lead_sources = list(
        leads_in_range.values("source").annotate(count=Count("id")).order_by("-count").values("source", "count")
    )

    funnel_order = ["new", "contacted", "qualified", "proposal", "negotiation", "won"]
    funnel_counts = dict(leads.values("status").annotate(count=Count("id")).values_list("status", "count"))
    conversion_funnel = [{"stage": s, "count": funnel_counts.get(s, 0)} for s in funnel_order]

    from apps.activities.models import Activity
    from apps.activities.serializers import ActivitySerializer

    activity_timeline = ActivitySerializer(
        Activity.all_objects.filter(organization=org).select_related("actor").order_by("-created_at")[:20],
        many=True,
    ).data

    charts = {
        "leads_over_time": _series_by_day(leads, "created_at", start, end),
        "deals_over_time": _series_by_day(deals, "created_at", start, end),
        "revenue_over_time": [
            {"date": row["day"].date().isoformat(), "value": row["total"] or 0}
            for row in deals.filter(stage__is_won=True, closed_at__gte=start, closed_at__lte=end)
            .annotate(day=TruncDay("closed_at"))
            .values("day")
            .annotate(total=Sum("amount"))
            .order_by("day")
        ],
        "pipeline_stages": pipeline_stages,
        "lead_sources": lead_sources,
        "conversion_funnel": conversion_funnel,
        "sales_performance": list(
            deals_in_range.filter(stage__is_won=True)
            .values("owner__first_name", "owner__last_name", "owner_id")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")
        ),
        "activity_timeline": activity_timeline,
    }

    return Response({"range": {"start": start.isoformat(), "end": end.isoformat()}, "stats": stats, "charts": charts})

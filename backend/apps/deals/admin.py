from django.contrib import admin

from apps.deals.models import Deal, Pipeline, PipelineStage


class PipelineStageInline(admin.TabularInline):
    model = PipelineStage
    extra = 1


@admin.register(Pipeline)
class PipelineAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "is_default")
    list_filter = ("organization",)
    inlines = [PipelineStageInline]


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "pipeline", "stage", "amount", "owner")
    list_filter = ("organization", "pipeline", "stage")
    search_fields = ("name",)

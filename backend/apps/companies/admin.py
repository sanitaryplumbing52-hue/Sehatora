from django.contrib import admin

from apps.companies.models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "industry", "country", "owner")
    list_filter = ("organization", "industry", "country")
    search_fields = ("name", "website", "email")

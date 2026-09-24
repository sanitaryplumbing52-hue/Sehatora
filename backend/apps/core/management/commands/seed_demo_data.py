import datetime
import random

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import DEFAULT_ROLE_PRESETS, Role, Team, User
from apps.companies.models import Company
from apps.contacts.models import LEAD_SOURCE_CHOICES, Contact
from apps.core.models import Organization, Tag
from apps.deals.models import Deal, Pipeline, PipelineStage
from apps.leads.models import Lead
from apps.tasks.models import Task

try:
    from faker import Faker
except ImportError:  # pragma: no cover
    Faker = None

SALES_STAGES = [
    ("New Lead", 10, False, False),
    ("Qualified", 20, False, False),
    ("Contacted", 30, False, False),
    ("Meeting", 40, False, False),
    ("Proposal", 60, False, False),
    ("Negotiation", 80, False, False),
    ("Won", 100, True, False),
    ("Lost", 0, False, True),
]

SERVICE_STAGES = [
    ("Inquiry", 10, False, False),
    ("Consultation Booked", 30, False, False),
    ("Proposal Sent", 60, False, False),
    ("Service Won", 100, True, False),
    ("Service Lost", 0, False, True),
]

FIRST_NAMES = None  # populated via Faker at runtime


class Command(BaseCommand):
    help = "Seeds a demo Organization with realistic users, contacts, companies, leads, deals, pipelines, tasks and tags so the CRM looks populated after install."

    def add_arguments(self, parser):
        parser.add_argument("--org-name", default="Sehatora CRM Demo")
        parser.add_argument("--flush", action="store_true", help="Delete the demo org before reseeding it.")

    @transaction.atomic
    def handle(self, *args, **options):
        if Faker is None:
            self.stderr.write("Faker is required for seeding: pip install Faker")
            return

        fake = Faker()
        org_name = options["org_name"]
        slug = "sehatora-demo"

        if options["flush"]:
            Organization.objects.filter(slug=slug).delete()

        org, _ = Organization.objects.get_or_create(
            slug=slug, defaults={"name": org_name, "timezone": "Asia/Dubai", "currency": "AED"}
        )

        self.stdout.write(self.style.NOTICE(f"Seeding organization: {org.name}"))

        roles = {}
        for name, permissions in DEFAULT_ROLE_PRESETS.items():
            role, _ = Role.objects.get_or_create(
                organization=org, name=name, defaults={"permissions": permissions, "is_system": True}
            )
            roles[name] = role

        team_names = ["Sales Team", "Marketing Team", "Support Team"]
        teams = {}
        for name in team_names:
            team, _ = Team.objects.get_or_create(organization=org, name=name)
            teams[name] = team

        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults=dict(
                email="admin@sehatora.local",
                first_name="Admin",
                last_name="User",
                organization=org,
                role=roles["Super Admin"],
                is_staff=True,
                is_superuser=True,
                is_org_owner=True,
            ),
        )
        if created:
            admin_user.set_password("SehatoraDemo#2026")
            admin_user.save()

        role_cycle = ["Sales", "Sales", "Sales", "Marketing", "Marketing", "Support", "Manager", "Viewer"]
        users = [admin_user]
        for i in range(19):
            role_name = role_cycle[i % len(role_cycle)]
            team = teams["Sales Team"] if role_name == "Sales" else teams["Marketing Team"] if role_name == "Marketing" else teams["Support Team"]
            first, last = fake.first_name(), fake.last_name()
            username = f"{first}.{last}.{i}".lower().replace(" ", "")
            user, created = User.objects.get_or_create(
                username=username,
                defaults=dict(
                    email=f"{username}@sehatora.local",
                    first_name=first,
                    last_name=last,
                    organization=org,
                    role=roles[role_name],
                    team=team,
                    job_title=fake.job(),
                ),
            )
            if created:
                user.set_password("SehatoraDemo#2026")
                user.save()
            users.append(user)

        tag_defs = [("VIP", "#DC2626"), ("Hot Lead", "#F59E0B"), ("Cold", "#64748B"), ("Newsletter", "#2563EB"), ("Enterprise", "#16A34A")]
        tags = []
        for name, color in tag_defs:
            tag, _ = Tag.objects.get_or_create(organization=org, name=name, defaults={"color": color})
            tags.append(tag)

        sales_pipeline, _ = Pipeline.objects.get_or_create(
            organization=org, name="Sales Pipeline", defaults={"is_default": True, "order": 0}
        )
        service_pipeline, _ = Pipeline.objects.get_or_create(
            organization=org, name="Service Pipeline", defaults={"is_default": False, "order": 1}
        )

        def build_stages(pipeline, definitions):
            stages = []
            for order, (name, prob, is_won, is_lost) in enumerate(definitions):
                stage, _ = PipelineStage.objects.get_or_create(
                    organization=org,
                    pipeline=pipeline,
                    name=name,
                    defaults={"order": order, "probability": prob, "is_won": is_won, "is_lost": is_lost},
                )
                stages.append(stage)
            return stages

        sales_stages = build_stages(sales_pipeline, SALES_STAGES)
        build_stages(service_pipeline, SERVICE_STAGES)

        industries = ["Healthcare", "Retail", "Real Estate", "Technology", "Education", "Hospitality", "Finance"]
        companies = []
        for _ in range(30):
            company = Company.objects.create(
                organization=org,
                name=fake.company(),
                website=fake.url(),
                industry=random.choice(industries),
                phone=fake.phone_number()[:32],
                email=fake.company_email(),
                address=fake.street_address(),
                city=fake.city(),
                country=fake.country(),
                employees=random.choice([c[0] for c in Company._meta.get_field("employees").choices]),
                annual_revenue=random.randint(50_000, 5_000_000),
                owner=random.choice(users),
                notes=fake.catch_phrase(),
                created_by=admin_user,
                updated_by=admin_user,
            )
            company.tags.add(*random.sample(tags, k=random.randint(0, 2)))
            companies.append(company)

        sources = [c[0] for c in LEAD_SOURCE_CHOICES]
        lifecycle = ["subscriber", "lead", "mql", "sql", "opportunity", "customer"]
        contacts = []
        now = timezone.now()
        for _ in range(100):
            first, last = fake.first_name(), fake.last_name()
            contact = Contact.objects.create(
                organization=org,
                first_name=first,
                last_name=last,
                email=fake.unique.email(),
                phone=fake.phone_number()[:32],
                whatsapp=fake.phone_number()[:32],
                company=random.choice(companies) if random.random() > 0.2 else None,
                job_title=fake.job(),
                city=fake.city(),
                country=fake.country(),
                lead_source=random.choice(sources),
                lead_status=random.choice(["new", "open", "in_progress", "connected"]),
                lifecycle_stage=random.choice(lifecycle),
                owner=random.choice(users),
                notes=fake.sentence(),
                lead_score=random.randint(0, 90),
                last_activity_at=now - datetime.timedelta(days=random.randint(0, 45)),
                next_follow_up_at=now + datetime.timedelta(days=random.randint(1, 14)),
                created_by=admin_user,
                updated_by=admin_user,
            )
            contact.tags.add(*random.sample(tags, k=random.randint(0, 2)))
            contacts.append(contact)

        lead_statuses = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost", "nurturing"]
        leads = []
        for contact in random.sample(contacts, k=50):
            lead = Lead.objects.create(
                organization=org,
                contact=contact,
                company=contact.company,
                source=contact.lead_source,
                status=random.choice(lead_statuses),
                owner=contact.owner,
                score=contact.lead_score,
                next_follow_up_at=contact.next_follow_up_at,
                notes=fake.sentence(),
                created_by=admin_user,
                updated_by=admin_user,
            )
            leads.append(lead)

        for i in range(25):
            contact = random.choice(contacts)
            stage = random.choice(sales_stages)
            Deal.objects.create(
                organization=org,
                name=f"{contact.company.name if contact.company else contact.full_name} - {fake.bs().title()}",
                pipeline=sales_pipeline,
                stage=stage,
                contact=contact,
                company=contact.company,
                amount=random.randint(5_000, 250_000),
                probability=stage.probability,
                owner=contact.owner,
                expected_close_date=(now + datetime.timedelta(days=random.randint(-10, 60))).date(),
                closed_at=now if stage.is_won or stage.is_lost else None,
                created_by=admin_user,
                updated_by=admin_user,
            )

        priorities = ["low", "medium", "high"]
        statuses = ["pending", "in_progress", "completed", "cancelled"]
        for _ in range(60):
            contact = random.choice(contacts)
            Task.objects.create(
                organization=org,
                name=random.choice(
                    ["Follow up call", "Send proposal", "Schedule demo", "Check in email", "Renewal reminder", "Send quote"]
                ),
                task_type=random.choice(["task", "call", "email", "meeting"]),
                assigned_to=contact.owner,
                contact=contact,
                company=contact.company,
                due_date=now + datetime.timedelta(days=random.randint(-5, 20)),
                priority=random.choice(priorities),
                status=random.choice(statuses),
                notes=fake.sentence(),
                created_by=admin_user,
                updated_by=admin_user,
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
        self.stdout.write(self.style.SUCCESS(f"Login: admin / SehatoraDemo#2026 (org: {org.name})"))

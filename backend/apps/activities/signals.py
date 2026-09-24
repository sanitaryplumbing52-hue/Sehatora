from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.activities.utils import log_activity, notify
from apps.companies.models import Company
from apps.contacts.models import Contact
from apps.deals.models import Deal
from apps.leads.models import Lead


@receiver(post_save, sender=Contact)
def contact_created(sender, instance, created, **kwargs):
    if created:
        log_activity(instance, "created", f"Contact {instance.full_name} created", actor=instance.created_by)


@receiver(post_save, sender=Company)
def company_created(sender, instance, created, **kwargs):
    if created:
        log_activity(instance, "created", f"Company {instance.name} created", actor=instance.created_by)


@receiver(post_save, sender=Lead)
def lead_created(sender, instance, created, **kwargs):
    if created:
        log_activity(instance, "created", f"Lead created for {instance.contact.full_name}", actor=instance.created_by)
        log_activity(
            instance.contact,
            "status_change",
            "Became a lead",
            actor=instance.created_by,
            metadata={"source": instance.source},
        )
        if instance.owner:
            notify(
                instance.owner,
                "new_lead",
                "New lead assigned to you",
                f"{instance.contact.full_name} ({instance.get_source_display()})",
                url=f"/leads/{instance.id}",
            )


@receiver(pre_save, sender=Deal)
def deal_stage_before_save(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_stage_id = None
        return
    previous = Deal.all_objects.filter(pk=instance.pk).only("stage_id").first()
    instance._previous_stage_id = previous.stage_id if previous else None


@receiver(post_save, sender=Deal)
def deal_created_or_stage_changed(sender, instance, created, **kwargs):
    if created:
        log_activity(instance, "created", f"Deal {instance.name} created", actor=instance.created_by)
        if instance.owner:
            notify(instance.owner, "new_deal", "New deal assigned to you", instance.name, url=f"/deals/{instance.id}")
        return

    previous_stage_id = getattr(instance, "_previous_stage_id", None)
    if previous_stage_id and previous_stage_id != instance.stage_id:
        log_activity(
            instance,
            "deal_stage_change",
            f"Moved to {instance.stage.name}",
            actor=instance.updated_by,
            metadata={"from_stage": str(previous_stage_id), "to_stage": str(instance.stage_id)},
        )
        if instance.owner and (instance.stage.is_won or instance.stage.is_lost):
            kind = "deal_won" if instance.stage.is_won else "deal_lost"
            notify(instance.owner, kind, f"Deal {kind.replace('_', ' ')}: {instance.name}", url=f"/deals/{instance.id}")

<?php

declare(strict_types=1);

namespace App\Domain\Identity\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $organizationName,
        private readonly string $inviterName,
        private readonly string $roleName,
        private readonly string $token,
    ) {
        $this->onQueue('mail');
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('marketing.frontend_url'), '/').'/invitations/accept?token='.urlencode($this->token);

        return (new MailMessage)
            ->subject("You're invited to {$this->organizationName}")
            ->line("{$this->inviterName} invited you to join {$this->organizationName} as {$this->roleName}.")
            ->action('Accept invitation', $url)
            ->line('This invitation expires in '.config('marketing.invitations.ttl_days').' days. Sign in or register with this email address to accept it.');
    }
}

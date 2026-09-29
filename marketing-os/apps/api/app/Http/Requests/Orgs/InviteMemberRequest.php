<?php

declare(strict_types=1);

namespace App\Http\Requests\Orgs;

use Illuminate\Foundation\Http\FormRequest;

class InviteMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['email' => ['required', 'email:rfc', 'max:254'], 'role' => ['required', 'string', 'exists:roles,key']];
    }
}

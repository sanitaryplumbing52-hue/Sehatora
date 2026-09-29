<?php

declare(strict_types=1);

namespace App\Http\Requests\Orgs;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:120'],
            'timezone' => ['sometimes', 'timezone:all'],
            'default_currency' => ['sometimes', 'string', 'size:3', 'alpha'],
        ];
    }
}

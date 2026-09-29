<?php

declare(strict_types=1);

namespace App\Http\Requests\Projects;

use Illuminate\Foundation\Http\FormRequest;

class WebsiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // URL is immutable after creation (delete and re-add to change origin); enforced by omission on update.
            'url' => [$this->isMethod('POST') ? 'required' : 'prohibited', 'string', 'max:2048'],
            'name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'cms' => ['sometimes', 'string', 'in:unknown,wordpress,shopify,other'],
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Requests\Projects;

use Illuminate\Foundation\Http\FormRequest;

class ProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $req = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'name' => [$req, 'string', 'min:2', 'max:120'],
            'industry' => ['sometimes', 'nullable', 'string', 'max:120'],
            'market' => ['sometimes', 'nullable', 'string', 'max:120'],
            'currency' => ['sometimes', 'string', 'size:3', 'alpha'],
            'timezone' => ['sometimes', 'timezone:all'],
            'goals' => ['sometimes', 'nullable', 'array', 'max:20'],
            'goals.*' => ['string', 'max:200'],
            'archived' => ['sometimes', 'boolean'],
        ];
    }

    public function validated($key = null, $default = null)
    {
        $data = parent::validated($key, $default);
        if (is_array($data) && isset($data['currency'])) {
            $data['currency'] = strtoupper($data['currency']);
        }

        return $data;
    }
}

<?php

namespace App\Http\Requests;

use App\Models\Penyewa;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'namaPenyewa' => ['required', 'string', 'max:255'],
            'noHp' => ['required', 'string', Penyewa::ATURAN_NO_HP],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(Penyewa::class, 'email')->ignore($this->user()->getKey(), 'idPenyewa'),
            ],
        ];
    }

    public function messages(): array
    {
        return ['noHp.regex' => Penyewa::PESAN_NO_HP];
    }
}

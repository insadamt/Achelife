<?php

namespace App\Http\Controllers;

use App\Models\MoneyCategory;
use App\Models\MoneyMerchant;
use App\Models\MoneyTag;
use App\Support\Money\MoneyPresetPack;
use App\Support\Money\MoneyViewDataFactory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MoneyOrganizationController extends Controller
{
    public function __invoke(Request $request, MoneyViewDataFactory $factory, MoneyPresetPack $presetPack): Response
    {
        $user = $request->user();
        $categories = $user->moneyCategories()
            ->with(['subcategories' => fn ($query) => $query->withCount('transactions')->orderBy('name')])
            ->withCount('transactions')
            ->orderBy('type')->orderBy('name')->get();
        $merchants = $user->moneyMerchants()->withCount('transactions')->orderBy('name')->get();
        $tags = $user->moneyTags()->withCount('transactions')->orderBy('name')->get();

        return Inertia::render('money/organization/Index', [
            'initialSection' => $request->enum('section', OrganizationSection::class)?->value ?? OrganizationSection::Categories->value,
            'categories' => $categories->map(fn (MoneyCategory $category) => $factory->category($category)),
            'merchants' => $merchants->map(fn (MoneyMerchant $merchant) => $factory->merchant($merchant)),
            'tags' => $tags->map(fn (MoneyTag $tag) => $factory->tag($tag)),
            'presetPack' => $presetPack->preview($user),
        ]);
    }
}

enum OrganizationSection: string
{
    case Categories = 'categories';
    case Merchants = 'merchants';
    case Tags = 'tags';
}

<?php

namespace App\Data\Portability;

class PortableTableDefinition
{
    /**
     * @param  list<string>  $columns
     * @param  array<string, string>  $foreignKeys
     */
    public function __construct(
        public readonly string $name,
        public readonly string $module,
        public readonly array $columns,
        public readonly array $foreignKeys = [],
        public readonly ?string $identityColumn = 'id',
        public readonly ?string $ownerTable = null,
        public readonly ?string $ownerForeignKey = null,
    ) {}

    public function path(): string
    {
        return "tables/{$this->name}.ndjson";
    }

    public function isDirectlyUserOwned(): bool
    {
        return in_array('user_id', $this->columns, true);
    }
}

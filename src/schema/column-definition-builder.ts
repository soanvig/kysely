import { CheckConstraintNode } from '../operation-node/check-constraint-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
import {
  OnModifyForeignAction,
  ReferencesNode,
} from '../operation-node/references-node.js'
import { SelectAllNode } from '../operation-node/select-all-node.js'
import { parseStringReference } from '../parser/reference-parser.js'
import { preventAwait } from '../util/prevent-await.js'
import { ColumnDefinitionNode } from '../operation-node/column-definition-node.js'
import { AnyRawBuilder } from '../util/type-utils.js'
import {
  DefaultValueExpression,
  parseDefaultValueExpression,
} from '../parser/default-value-parser.js'
import { GeneratedNode } from '../operation-node/generated-node.js'
import { DefaultValueNode } from '../operation-node/default-value-node.js'

export interface ColumnDefinitionBuilderInterface {
  /**
   * Adds `auto_increment` or `autoincrement` to the column definition
   * depending on the dialect.
   *
   * Some dialects like PostgreSQL don't support this. On PostgreSQL
   * you can use the `serial` or `bigserial` data type instead.
   */
  autoIncrement(): ColumnDefinitionBuilderInterface

  /**
   * Makes the column the primary key.
   *
   * If you want to specify a composite primary key use the
   * {@link TableBuilder.addPrimaryKeyConstraint} method.
   */
  primaryKey(): ColumnDefinitionBuilderInterface

  /**
   * Adds a foreign key constraint for the column.
   *
   * If your database engine doesn't support foreign key constraints in the
   * column definition (like MySQL 5) you need to call the table level
   * {@link TableBuilder.addForeignKeyConstraint} method instead.
   *
   * ### Examples
   *
   * ```ts
   * col.references('person.id')
   * ```
   */
  references(ref: string): ColumnDefinitionBuilderInterface

  /**
   * Adds an `on delete` constraint for the foreign key column.
   *
   * If your database engine doesn't support foreign key constraints in the
   * column definition (like MySQL 5) you need to call the table level
   * {@link TableBuilder.addForeignKeyConstraint} method instead.
   *
   * ### Examples
   *
   * ```ts
   * col.references('person.id').onDelete('cascade')
   * ```
   */
  onDelete(onDelete: OnModifyForeignAction): ColumnDefinitionBuilderInterface

  /**
   * Adds an `on update` constraint for the foreign key column.
   *
   * ### Examples
   *
   * ```ts
   * col.references('person.id').onUpdate('cascade')
   * ```
   */
  onUpdate(onUpdate: OnModifyForeignAction): ColumnDefinitionBuilderInterface

  /**
   * Adds a unique constraint for the column.
   */
  unique(): ColumnDefinitionBuilderInterface

  /**
   * Adds a `not null` constraint for the column.
   */
  notNull(): ColumnDefinitionBuilderInterface

  /**
   * Adds a `unsigned` modifier for the column.
   *
   * This only works on some dialects like MySQL.
   */
  unsigned(): ColumnDefinitionBuilderInterface

  /**
   * Adds a default value constraint for the column.
   *
   * ### Examples
   *
   * ```ts
   * db.schema
   *   .createTable('pet')
   *   .addColumn('number_of_legs', 'integer', (col) => col.defaultTo(4))
   *   .execute()
   * ```
   *
   * Values passed to `defaultTo` are interpreted as value literals by default. You can define
   * an arbitrary SQL expression using the {@link sql} template tag:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * db.schema
   *   .createTable('pet')
   *   .addColumn(
   *     'number_of_legs',
   *     'integer',
   *     (col) => col.defaultTo(sql`any SQL here`)
   *   )
   *   .execute()
   * ```
   */
  defaultTo(value: DefaultValueExpression): ColumnDefinitionBuilderInterface

  /**
   * Adds a check constraint for the column.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * db.schema
   *   .createTable('pet')
   *   .addColumn('number_of_legs', 'integer', (col) =>
   *     col.check(sql`number_of_legs < 5`)
   *   )
   *   .execute()
   * ```
   */
  check(expression: AnyRawBuilder): ColumnDefinitionBuilderInterface

  /**
   * Makes the column a generated column using a `generated always as` statement.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * db.schema
   *   .createTable('person')
   *   .addColumn('full_name', 'varchar(255)',
   *     (col) => col.generatedAlwaysAs(sql`concat(first_name, ' ', last_name)`)
   *   )
   *   .execute()
   * ```
   */
  generatedAlwaysAs(expression: AnyRawBuilder): ColumnDefinitionBuilderInterface

  /**
   * Adds the `generated always as identity` specifier on supported dialects.
   */
  generatedAlwaysAsIdentity(): ColumnDefinitionBuilderInterface

  /**
   * Adds the `generated by default as identity` specifier on supported dialects.
   */
  generatedByDefaultAsIdentity(): ColumnDefinitionBuilderInterface

  /**
   * Makes a generated column stored instead of virtual. This method can only
   * be used with {@link generatedAlwaysAs}
   *
   * ### Examples
   *
   * ```ts
   * db.schema
   *   .createTable('person')
   *   .addColumn('full_name', 'varchar(255)', (col) => col
   *     .generatedAlwaysAs("concat(first_name, ' ', last_name)")
   *     .stored()
   *   )
   *   .execute()
   * ```
   */
  stored(): ColumnDefinitionBuilderInterface
}

export class ColumnDefinitionBuilder
  implements ColumnDefinitionBuilderInterface, OperationNodeSource
{
  readonly #node: ColumnDefinitionNode

  constructor(node: ColumnDefinitionNode) {
    this.#node = node
  }

  autoIncrement(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { autoIncrement: true })
    )
  }

  primaryKey(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { primaryKey: true })
    )
  }

  references(ref: string): ColumnDefinitionBuilder {
    const references = parseStringReference(ref)

    if (!ReferenceNode.is(references) || SelectAllNode.is(references.column)) {
      throw new Error(
        `invalid call references('${ref}'). The reference must have format table.column or schema.table.column`
      )
    }

    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        references: ReferencesNode.create(references.table, [
          references.column,
        ]),
      })
    )
  }

  onDelete(onDelete: OnModifyForeignAction): ColumnDefinitionBuilder {
    if (!this.#node.references) {
      throw new Error('on delete constraint can only be added for foreign keys')
    }

    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        references: ReferencesNode.cloneWithOnDelete(
          this.#node.references,
          onDelete
        ),
      })
    )
  }

  onUpdate(onUpdate: OnModifyForeignAction): ColumnDefinitionBuilder {
    if (!this.#node.references) {
      throw new Error('on update constraint can only be added for foreign keys')
    }

    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        references: ReferencesNode.cloneWithOnUpdate(
          this.#node.references,
          onUpdate
        ),
      })
    )
  }

  unique(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { unique: true })
    )
  }

  notNull(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { notNull: true })
    )
  }

  unsigned(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { unsigned: true })
    )
  }

  defaultTo(value: DefaultValueExpression): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        defaultTo: DefaultValueNode.create(parseDefaultValueExpression(value)),
      })
    )
  }

  check(expression: AnyRawBuilder): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        check: CheckConstraintNode.create(expression.toOperationNode()),
      })
    )
  }

  generatedAlwaysAs(expression: AnyRawBuilder): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        generated: GeneratedNode.createWithExpression(
          expression.toOperationNode()
        ),
      })
    )
  }

  generatedAlwaysAsIdentity(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        generated: GeneratedNode.create({ identity: true, always: true }),
      })
    )
  }

  generatedByDefaultAsIdentity(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        generated: GeneratedNode.create({ identity: true, byDefault: true }),
      })
    )
  }

  stored(): ColumnDefinitionBuilder {
    if (!this.#node.generated) {
      throw new Error('stored() can only be called after generatedAlwaysAs')
    }

    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        generated: GeneratedNode.cloneWith(this.#node.generated, {
          stored: true,
        }),
      })
    )
  }

  toOperationNode(): ColumnDefinitionNode {
    return this.#node
  }
}

preventAwait(
  ColumnDefinitionBuilder,
  "don't await ColumnDefinitionBuilder instances directly."
)

import { Expression } from '../expression/expression.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
} from '../parser/binary-operation-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { ExistsExpression } from '../parser/unary-operation-parser.js'
import { SqlBool } from '../util/type-utils.js'
import { HavingExpressionBuilder } from './deprecated-having-expression-builder.js'

export interface HavingInterface<DB, TB extends keyof DB> {
  /**
   * Just like {@link WhereInterface.where | where} but adds a `having` statement
   * instead of a `where` statement.
   */
  having<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): HavingInterface<DB, TB>

  having(factory: HavingExpressionFactory<DB, TB>): HavingInterface<DB, TB>
  having(expression: Expression<any>): HavingInterface<DB, TB>

  /**
   * Just like {@link WhereInterface.whereRef | whereRef} but adds a `having` statement
   * instead of a `where` statement.
   */
  havingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): HavingInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orHaving<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): HavingInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orHaving(factory: HavingExpressionFactory<DB, TB>): HavingInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orHaving(expression: Expression<any>): HavingInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orHavingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): HavingInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  havingExists(arg: ExistsExpression<DB, TB>): HavingInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  havingNotExists(arg: ExistsExpression<DB, TB>): HavingInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orHavingExists(arg: ExistsExpression<DB, TB>): HavingInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orHavingNotExists(arg: ExistsExpression<DB, TB>): HavingInterface<DB, TB>
}

export type HavingExpressionFactory<DB, TB extends keyof DB> = (
  eb: HavingExpressionBuilder<DB, TB>
) => Expression<SqlBool> | HavingExpressionBuilder<DB, TB>

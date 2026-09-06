
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Member
 * 
 */
export type Member = $Result.DefaultSelection<Prisma.$MemberPayload>
/**
 * Model MemberRole
 * 
 */
export type MemberRole = $Result.DefaultSelection<Prisma.$MemberRolePayload>
/**
 * Model Wallet
 * 
 */
export type Wallet = $Result.DefaultSelection<Prisma.$WalletPayload>
/**
 * Model Transaction
 * 
 */
export type Transaction = $Result.DefaultSelection<Prisma.$TransactionPayload>
/**
 * Model Reward
 * 
 */
export type Reward = $Result.DefaultSelection<Prisma.$RewardPayload>
/**
 * Model Evaluation
 * 
 */
export type Evaluation = $Result.DefaultSelection<Prisma.$EvaluationPayload>
/**
 * Model RelationshipStrength
 * 
 */
export type RelationshipStrength = $Result.DefaultSelection<Prisma.$RelationshipStrengthPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  SPONSOR: 'SPONSOR',
  CURATOR: 'CURATOR',
  MAKER: 'MAKER'
};

export type Role = (typeof Role)[keyof typeof Role]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Members
 * const members = await prisma.member.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Members
   * const members = await prisma.member.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.member`: Exposes CRUD operations for the **Member** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Members
    * const members = await prisma.member.findMany()
    * ```
    */
  get member(): Prisma.MemberDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.memberRole`: Exposes CRUD operations for the **MemberRole** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MemberRoles
    * const memberRoles = await prisma.memberRole.findMany()
    * ```
    */
  get memberRole(): Prisma.MemberRoleDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.wallet`: Exposes CRUD operations for the **Wallet** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Wallets
    * const wallets = await prisma.wallet.findMany()
    * ```
    */
  get wallet(): Prisma.WalletDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.transaction`: Exposes CRUD operations for the **Transaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Transactions
    * const transactions = await prisma.transaction.findMany()
    * ```
    */
  get transaction(): Prisma.TransactionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.reward`: Exposes CRUD operations for the **Reward** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Rewards
    * const rewards = await prisma.reward.findMany()
    * ```
    */
  get reward(): Prisma.RewardDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.evaluation`: Exposes CRUD operations for the **Evaluation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Evaluations
    * const evaluations = await prisma.evaluation.findMany()
    * ```
    */
  get evaluation(): Prisma.EvaluationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.relationshipStrength`: Exposes CRUD operations for the **RelationshipStrength** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RelationshipStrengths
    * const relationshipStrengths = await prisma.relationshipStrength.findMany()
    * ```
    */
  get relationshipStrength(): Prisma.RelationshipStrengthDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Member: 'Member',
    MemberRole: 'MemberRole',
    Wallet: 'Wallet',
    Transaction: 'Transaction',
    Reward: 'Reward',
    Evaluation: 'Evaluation',
    RelationshipStrength: 'RelationshipStrength'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "member" | "memberRole" | "wallet" | "transaction" | "reward" | "evaluation" | "relationshipStrength"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Member: {
        payload: Prisma.$MemberPayload<ExtArgs>
        fields: Prisma.MemberFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MemberFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MemberFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>
          }
          findFirst: {
            args: Prisma.MemberFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MemberFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>
          }
          findMany: {
            args: Prisma.MemberFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>[]
          }
          create: {
            args: Prisma.MemberCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>
          }
          createMany: {
            args: Prisma.MemberCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MemberCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>[]
          }
          delete: {
            args: Prisma.MemberDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>
          }
          update: {
            args: Prisma.MemberUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>
          }
          deleteMany: {
            args: Prisma.MemberDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MemberUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MemberUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>[]
          }
          upsert: {
            args: Prisma.MemberUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberPayload>
          }
          aggregate: {
            args: Prisma.MemberAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMember>
          }
          groupBy: {
            args: Prisma.MemberGroupByArgs<ExtArgs>
            result: $Utils.Optional<MemberGroupByOutputType>[]
          }
          count: {
            args: Prisma.MemberCountArgs<ExtArgs>
            result: $Utils.Optional<MemberCountAggregateOutputType> | number
          }
        }
      }
      MemberRole: {
        payload: Prisma.$MemberRolePayload<ExtArgs>
        fields: Prisma.MemberRoleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MemberRoleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberRolePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MemberRoleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberRolePayload>
          }
          findFirst: {
            args: Prisma.MemberRoleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberRolePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MemberRoleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberRolePayload>
          }
          findMany: {
            args: Prisma.MemberRoleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberRolePayload>[]
          }
          create: {
            args: Prisma.MemberRoleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberRolePayload>
          }
          createMany: {
            args: Prisma.MemberRoleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MemberRoleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberRolePayload>[]
          }
          delete: {
            args: Prisma.MemberRoleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberRolePayload>
          }
          update: {
            args: Prisma.MemberRoleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberRolePayload>
          }
          deleteMany: {
            args: Prisma.MemberRoleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MemberRoleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MemberRoleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberRolePayload>[]
          }
          upsert: {
            args: Prisma.MemberRoleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MemberRolePayload>
          }
          aggregate: {
            args: Prisma.MemberRoleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMemberRole>
          }
          groupBy: {
            args: Prisma.MemberRoleGroupByArgs<ExtArgs>
            result: $Utils.Optional<MemberRoleGroupByOutputType>[]
          }
          count: {
            args: Prisma.MemberRoleCountArgs<ExtArgs>
            result: $Utils.Optional<MemberRoleCountAggregateOutputType> | number
          }
        }
      }
      Wallet: {
        payload: Prisma.$WalletPayload<ExtArgs>
        fields: Prisma.WalletFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WalletFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WalletFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          findFirst: {
            args: Prisma.WalletFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WalletFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          findMany: {
            args: Prisma.WalletFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>[]
          }
          create: {
            args: Prisma.WalletCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          createMany: {
            args: Prisma.WalletCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WalletCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>[]
          }
          delete: {
            args: Prisma.WalletDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          update: {
            args: Prisma.WalletUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          deleteMany: {
            args: Prisma.WalletDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WalletUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WalletUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>[]
          }
          upsert: {
            args: Prisma.WalletUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          aggregate: {
            args: Prisma.WalletAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWallet>
          }
          groupBy: {
            args: Prisma.WalletGroupByArgs<ExtArgs>
            result: $Utils.Optional<WalletGroupByOutputType>[]
          }
          count: {
            args: Prisma.WalletCountArgs<ExtArgs>
            result: $Utils.Optional<WalletCountAggregateOutputType> | number
          }
        }
      }
      Transaction: {
        payload: Prisma.$TransactionPayload<ExtArgs>
        fields: Prisma.TransactionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TransactionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TransactionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          findFirst: {
            args: Prisma.TransactionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TransactionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          findMany: {
            args: Prisma.TransactionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          create: {
            args: Prisma.TransactionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          createMany: {
            args: Prisma.TransactionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TransactionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          delete: {
            args: Prisma.TransactionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          update: {
            args: Prisma.TransactionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          deleteMany: {
            args: Prisma.TransactionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TransactionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TransactionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          upsert: {
            args: Prisma.TransactionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          aggregate: {
            args: Prisma.TransactionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTransaction>
          }
          groupBy: {
            args: Prisma.TransactionGroupByArgs<ExtArgs>
            result: $Utils.Optional<TransactionGroupByOutputType>[]
          }
          count: {
            args: Prisma.TransactionCountArgs<ExtArgs>
            result: $Utils.Optional<TransactionCountAggregateOutputType> | number
          }
        }
      }
      Reward: {
        payload: Prisma.$RewardPayload<ExtArgs>
        fields: Prisma.RewardFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RewardFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RewardPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RewardFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RewardPayload>
          }
          findFirst: {
            args: Prisma.RewardFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RewardPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RewardFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RewardPayload>
          }
          findMany: {
            args: Prisma.RewardFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RewardPayload>[]
          }
          create: {
            args: Prisma.RewardCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RewardPayload>
          }
          createMany: {
            args: Prisma.RewardCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RewardCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RewardPayload>[]
          }
          delete: {
            args: Prisma.RewardDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RewardPayload>
          }
          update: {
            args: Prisma.RewardUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RewardPayload>
          }
          deleteMany: {
            args: Prisma.RewardDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RewardUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RewardUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RewardPayload>[]
          }
          upsert: {
            args: Prisma.RewardUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RewardPayload>
          }
          aggregate: {
            args: Prisma.RewardAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReward>
          }
          groupBy: {
            args: Prisma.RewardGroupByArgs<ExtArgs>
            result: $Utils.Optional<RewardGroupByOutputType>[]
          }
          count: {
            args: Prisma.RewardCountArgs<ExtArgs>
            result: $Utils.Optional<RewardCountAggregateOutputType> | number
          }
        }
      }
      Evaluation: {
        payload: Prisma.$EvaluationPayload<ExtArgs>
        fields: Prisma.EvaluationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EvaluationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EvaluationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EvaluationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EvaluationPayload>
          }
          findFirst: {
            args: Prisma.EvaluationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EvaluationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EvaluationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EvaluationPayload>
          }
          findMany: {
            args: Prisma.EvaluationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EvaluationPayload>[]
          }
          create: {
            args: Prisma.EvaluationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EvaluationPayload>
          }
          createMany: {
            args: Prisma.EvaluationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EvaluationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EvaluationPayload>[]
          }
          delete: {
            args: Prisma.EvaluationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EvaluationPayload>
          }
          update: {
            args: Prisma.EvaluationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EvaluationPayload>
          }
          deleteMany: {
            args: Prisma.EvaluationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EvaluationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EvaluationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EvaluationPayload>[]
          }
          upsert: {
            args: Prisma.EvaluationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EvaluationPayload>
          }
          aggregate: {
            args: Prisma.EvaluationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEvaluation>
          }
          groupBy: {
            args: Prisma.EvaluationGroupByArgs<ExtArgs>
            result: $Utils.Optional<EvaluationGroupByOutputType>[]
          }
          count: {
            args: Prisma.EvaluationCountArgs<ExtArgs>
            result: $Utils.Optional<EvaluationCountAggregateOutputType> | number
          }
        }
      }
      RelationshipStrength: {
        payload: Prisma.$RelationshipStrengthPayload<ExtArgs>
        fields: Prisma.RelationshipStrengthFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RelationshipStrengthFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipStrengthPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RelationshipStrengthFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipStrengthPayload>
          }
          findFirst: {
            args: Prisma.RelationshipStrengthFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipStrengthPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RelationshipStrengthFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipStrengthPayload>
          }
          findMany: {
            args: Prisma.RelationshipStrengthFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipStrengthPayload>[]
          }
          create: {
            args: Prisma.RelationshipStrengthCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipStrengthPayload>
          }
          createMany: {
            args: Prisma.RelationshipStrengthCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RelationshipStrengthCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipStrengthPayload>[]
          }
          delete: {
            args: Prisma.RelationshipStrengthDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipStrengthPayload>
          }
          update: {
            args: Prisma.RelationshipStrengthUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipStrengthPayload>
          }
          deleteMany: {
            args: Prisma.RelationshipStrengthDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RelationshipStrengthUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RelationshipStrengthUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipStrengthPayload>[]
          }
          upsert: {
            args: Prisma.RelationshipStrengthUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RelationshipStrengthPayload>
          }
          aggregate: {
            args: Prisma.RelationshipStrengthAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRelationshipStrength>
          }
          groupBy: {
            args: Prisma.RelationshipStrengthGroupByArgs<ExtArgs>
            result: $Utils.Optional<RelationshipStrengthGroupByOutputType>[]
          }
          count: {
            args: Prisma.RelationshipStrengthCountArgs<ExtArgs>
            result: $Utils.Optional<RelationshipStrengthCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    member?: MemberOmit
    memberRole?: MemberRoleOmit
    wallet?: WalletOmit
    transaction?: TransactionOmit
    reward?: RewardOmit
    evaluation?: EvaluationOmit
    relationshipStrength?: RelationshipStrengthOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type MemberCountOutputType
   */

  export type MemberCountOutputType = {
    roles: number
    transactionsSent: number
    transactionsReceived: number
    rewardsSent: number
    rewardsReceived: number
    evaluationsGiven: number
    relationshipsFrom: number
    relationshipsTo: number
  }

  export type MemberCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    roles?: boolean | MemberCountOutputTypeCountRolesArgs
    transactionsSent?: boolean | MemberCountOutputTypeCountTransactionsSentArgs
    transactionsReceived?: boolean | MemberCountOutputTypeCountTransactionsReceivedArgs
    rewardsSent?: boolean | MemberCountOutputTypeCountRewardsSentArgs
    rewardsReceived?: boolean | MemberCountOutputTypeCountRewardsReceivedArgs
    evaluationsGiven?: boolean | MemberCountOutputTypeCountEvaluationsGivenArgs
    relationshipsFrom?: boolean | MemberCountOutputTypeCountRelationshipsFromArgs
    relationshipsTo?: boolean | MemberCountOutputTypeCountRelationshipsToArgs
  }

  // Custom InputTypes
  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberCountOutputType
     */
    select?: MemberCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeCountRolesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MemberRoleWhereInput
  }

  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeCountTransactionsSentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }

  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeCountTransactionsReceivedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }

  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeCountRewardsSentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RewardWhereInput
  }

  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeCountRewardsReceivedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RewardWhereInput
  }

  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeCountEvaluationsGivenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EvaluationWhereInput
  }

  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeCountRelationshipsFromArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RelationshipStrengthWhereInput
  }

  /**
   * MemberCountOutputType without action
   */
  export type MemberCountOutputTypeCountRelationshipsToArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RelationshipStrengthWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Member
   */

  export type AggregateMember = {
    _count: MemberCountAggregateOutputType | null
    _min: MemberMinAggregateOutputType | null
    _max: MemberMaxAggregateOutputType | null
  }

  export type MemberMinAggregateOutputType = {
    id: string | null
    name: string | null
    passwordHash: string | null
    createdAt: Date | null
  }

  export type MemberMaxAggregateOutputType = {
    id: string | null
    name: string | null
    passwordHash: string | null
    createdAt: Date | null
  }

  export type MemberCountAggregateOutputType = {
    id: number
    name: number
    passwordHash: number
    createdAt: number
    _all: number
  }


  export type MemberMinAggregateInputType = {
    id?: true
    name?: true
    passwordHash?: true
    createdAt?: true
  }

  export type MemberMaxAggregateInputType = {
    id?: true
    name?: true
    passwordHash?: true
    createdAt?: true
  }

  export type MemberCountAggregateInputType = {
    id?: true
    name?: true
    passwordHash?: true
    createdAt?: true
    _all?: true
  }

  export type MemberAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Member to aggregate.
     */
    where?: MemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Members to fetch.
     */
    orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Members from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Members.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Members
    **/
    _count?: true | MemberCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MemberMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MemberMaxAggregateInputType
  }

  export type GetMemberAggregateType<T extends MemberAggregateArgs> = {
        [P in keyof T & keyof AggregateMember]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMember[P]>
      : GetScalarType<T[P], AggregateMember[P]>
  }




  export type MemberGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MemberWhereInput
    orderBy?: MemberOrderByWithAggregationInput | MemberOrderByWithAggregationInput[]
    by: MemberScalarFieldEnum[] | MemberScalarFieldEnum
    having?: MemberScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MemberCountAggregateInputType | true
    _min?: MemberMinAggregateInputType
    _max?: MemberMaxAggregateInputType
  }

  export type MemberGroupByOutputType = {
    id: string
    name: string
    passwordHash: string | null
    createdAt: Date
    _count: MemberCountAggregateOutputType | null
    _min: MemberMinAggregateOutputType | null
    _max: MemberMaxAggregateOutputType | null
  }

  type GetMemberGroupByPayload<T extends MemberGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MemberGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MemberGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MemberGroupByOutputType[P]>
            : GetScalarType<T[P], MemberGroupByOutputType[P]>
        }
      >
    >


  export type MemberSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    roles?: boolean | Member$rolesArgs<ExtArgs>
    wallet?: boolean | Member$walletArgs<ExtArgs>
    transactionsSent?: boolean | Member$transactionsSentArgs<ExtArgs>
    transactionsReceived?: boolean | Member$transactionsReceivedArgs<ExtArgs>
    rewardsSent?: boolean | Member$rewardsSentArgs<ExtArgs>
    rewardsReceived?: boolean | Member$rewardsReceivedArgs<ExtArgs>
    evaluationsGiven?: boolean | Member$evaluationsGivenArgs<ExtArgs>
    relationshipsFrom?: boolean | Member$relationshipsFromArgs<ExtArgs>
    relationshipsTo?: boolean | Member$relationshipsToArgs<ExtArgs>
    _count?: boolean | MemberCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["member"]>

  export type MemberSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    passwordHash?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["member"]>

  export type MemberSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    passwordHash?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["member"]>

  export type MemberSelectScalar = {
    id?: boolean
    name?: boolean
    passwordHash?: boolean
    createdAt?: boolean
  }

  export type MemberOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "passwordHash" | "createdAt", ExtArgs["result"]["member"]>
  export type MemberInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    roles?: boolean | Member$rolesArgs<ExtArgs>
    wallet?: boolean | Member$walletArgs<ExtArgs>
    transactionsSent?: boolean | Member$transactionsSentArgs<ExtArgs>
    transactionsReceived?: boolean | Member$transactionsReceivedArgs<ExtArgs>
    rewardsSent?: boolean | Member$rewardsSentArgs<ExtArgs>
    rewardsReceived?: boolean | Member$rewardsReceivedArgs<ExtArgs>
    evaluationsGiven?: boolean | Member$evaluationsGivenArgs<ExtArgs>
    relationshipsFrom?: boolean | Member$relationshipsFromArgs<ExtArgs>
    relationshipsTo?: boolean | Member$relationshipsToArgs<ExtArgs>
    _count?: boolean | MemberCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type MemberIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type MemberIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $MemberPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Member"
    objects: {
      roles: Prisma.$MemberRolePayload<ExtArgs>[]
      wallet: Prisma.$WalletPayload<ExtArgs> | null
      transactionsSent: Prisma.$TransactionPayload<ExtArgs>[]
      transactionsReceived: Prisma.$TransactionPayload<ExtArgs>[]
      rewardsSent: Prisma.$RewardPayload<ExtArgs>[]
      rewardsReceived: Prisma.$RewardPayload<ExtArgs>[]
      evaluationsGiven: Prisma.$EvaluationPayload<ExtArgs>[]
      relationshipsFrom: Prisma.$RelationshipStrengthPayload<ExtArgs>[]
      relationshipsTo: Prisma.$RelationshipStrengthPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      passwordHash: string | null
      createdAt: Date
    }, ExtArgs["result"]["member"]>
    composites: {}
  }

  type MemberGetPayload<S extends boolean | null | undefined | MemberDefaultArgs> = $Result.GetResult<Prisma.$MemberPayload, S>

  type MemberCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MemberFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MemberCountAggregateInputType | true
    }

  export interface MemberDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Member'], meta: { name: 'Member' } }
    /**
     * Find zero or one Member that matches the filter.
     * @param {MemberFindUniqueArgs} args - Arguments to find a Member
     * @example
     * // Get one Member
     * const member = await prisma.member.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MemberFindUniqueArgs>(args: SelectSubset<T, MemberFindUniqueArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Member that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MemberFindUniqueOrThrowArgs} args - Arguments to find a Member
     * @example
     * // Get one Member
     * const member = await prisma.member.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MemberFindUniqueOrThrowArgs>(args: SelectSubset<T, MemberFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Member that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberFindFirstArgs} args - Arguments to find a Member
     * @example
     * // Get one Member
     * const member = await prisma.member.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MemberFindFirstArgs>(args?: SelectSubset<T, MemberFindFirstArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Member that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberFindFirstOrThrowArgs} args - Arguments to find a Member
     * @example
     * // Get one Member
     * const member = await prisma.member.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MemberFindFirstOrThrowArgs>(args?: SelectSubset<T, MemberFindFirstOrThrowArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Members that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Members
     * const members = await prisma.member.findMany()
     * 
     * // Get first 10 Members
     * const members = await prisma.member.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const memberWithIdOnly = await prisma.member.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MemberFindManyArgs>(args?: SelectSubset<T, MemberFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Member.
     * @param {MemberCreateArgs} args - Arguments to create a Member.
     * @example
     * // Create one Member
     * const Member = await prisma.member.create({
     *   data: {
     *     // ... data to create a Member
     *   }
     * })
     * 
     */
    create<T extends MemberCreateArgs>(args: SelectSubset<T, MemberCreateArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Members.
     * @param {MemberCreateManyArgs} args - Arguments to create many Members.
     * @example
     * // Create many Members
     * const member = await prisma.member.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MemberCreateManyArgs>(args?: SelectSubset<T, MemberCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Members and returns the data saved in the database.
     * @param {MemberCreateManyAndReturnArgs} args - Arguments to create many Members.
     * @example
     * // Create many Members
     * const member = await prisma.member.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Members and only return the `id`
     * const memberWithIdOnly = await prisma.member.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MemberCreateManyAndReturnArgs>(args?: SelectSubset<T, MemberCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Member.
     * @param {MemberDeleteArgs} args - Arguments to delete one Member.
     * @example
     * // Delete one Member
     * const Member = await prisma.member.delete({
     *   where: {
     *     // ... filter to delete one Member
     *   }
     * })
     * 
     */
    delete<T extends MemberDeleteArgs>(args: SelectSubset<T, MemberDeleteArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Member.
     * @param {MemberUpdateArgs} args - Arguments to update one Member.
     * @example
     * // Update one Member
     * const member = await prisma.member.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MemberUpdateArgs>(args: SelectSubset<T, MemberUpdateArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Members.
     * @param {MemberDeleteManyArgs} args - Arguments to filter Members to delete.
     * @example
     * // Delete a few Members
     * const { count } = await prisma.member.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MemberDeleteManyArgs>(args?: SelectSubset<T, MemberDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Members.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Members
     * const member = await prisma.member.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MemberUpdateManyArgs>(args: SelectSubset<T, MemberUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Members and returns the data updated in the database.
     * @param {MemberUpdateManyAndReturnArgs} args - Arguments to update many Members.
     * @example
     * // Update many Members
     * const member = await prisma.member.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Members and only return the `id`
     * const memberWithIdOnly = await prisma.member.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MemberUpdateManyAndReturnArgs>(args: SelectSubset<T, MemberUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Member.
     * @param {MemberUpsertArgs} args - Arguments to update or create a Member.
     * @example
     * // Update or create a Member
     * const member = await prisma.member.upsert({
     *   create: {
     *     // ... data to create a Member
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Member we want to update
     *   }
     * })
     */
    upsert<T extends MemberUpsertArgs>(args: SelectSubset<T, MemberUpsertArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Members.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberCountArgs} args - Arguments to filter Members to count.
     * @example
     * // Count the number of Members
     * const count = await prisma.member.count({
     *   where: {
     *     // ... the filter for the Members we want to count
     *   }
     * })
    **/
    count<T extends MemberCountArgs>(
      args?: Subset<T, MemberCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MemberCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Member.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MemberAggregateArgs>(args: Subset<T, MemberAggregateArgs>): Prisma.PrismaPromise<GetMemberAggregateType<T>>

    /**
     * Group by Member.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MemberGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MemberGroupByArgs['orderBy'] }
        : { orderBy?: MemberGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MemberGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMemberGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Member model
   */
  readonly fields: MemberFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Member.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MemberClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    roles<T extends Member$rolesArgs<ExtArgs> = {}>(args?: Subset<T, Member$rolesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MemberRolePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    wallet<T extends Member$walletArgs<ExtArgs> = {}>(args?: Subset<T, Member$walletArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    transactionsSent<T extends Member$transactionsSentArgs<ExtArgs> = {}>(args?: Subset<T, Member$transactionsSentArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    transactionsReceived<T extends Member$transactionsReceivedArgs<ExtArgs> = {}>(args?: Subset<T, Member$transactionsReceivedArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    rewardsSent<T extends Member$rewardsSentArgs<ExtArgs> = {}>(args?: Subset<T, Member$rewardsSentArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    rewardsReceived<T extends Member$rewardsReceivedArgs<ExtArgs> = {}>(args?: Subset<T, Member$rewardsReceivedArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    evaluationsGiven<T extends Member$evaluationsGivenArgs<ExtArgs> = {}>(args?: Subset<T, Member$evaluationsGivenArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EvaluationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    relationshipsFrom<T extends Member$relationshipsFromArgs<ExtArgs> = {}>(args?: Subset<T, Member$relationshipsFromArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    relationshipsTo<T extends Member$relationshipsToArgs<ExtArgs> = {}>(args?: Subset<T, Member$relationshipsToArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Member model
   */
  interface MemberFieldRefs {
    readonly id: FieldRef<"Member", 'String'>
    readonly name: FieldRef<"Member", 'String'>
    readonly passwordHash: FieldRef<"Member", 'String'>
    readonly createdAt: FieldRef<"Member", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Member findUnique
   */
  export type MemberFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * Filter, which Member to fetch.
     */
    where: MemberWhereUniqueInput
  }

  /**
   * Member findUniqueOrThrow
   */
  export type MemberFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * Filter, which Member to fetch.
     */
    where: MemberWhereUniqueInput
  }

  /**
   * Member findFirst
   */
  export type MemberFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * Filter, which Member to fetch.
     */
    where?: MemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Members to fetch.
     */
    orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Members.
     */
    cursor?: MemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Members from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Members.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Members.
     */
    distinct?: MemberScalarFieldEnum | MemberScalarFieldEnum[]
  }

  /**
   * Member findFirstOrThrow
   */
  export type MemberFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * Filter, which Member to fetch.
     */
    where?: MemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Members to fetch.
     */
    orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Members.
     */
    cursor?: MemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Members from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Members.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Members.
     */
    distinct?: MemberScalarFieldEnum | MemberScalarFieldEnum[]
  }

  /**
   * Member findMany
   */
  export type MemberFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * Filter, which Members to fetch.
     */
    where?: MemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Members to fetch.
     */
    orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Members.
     */
    cursor?: MemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Members from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Members.
     */
    skip?: number
    distinct?: MemberScalarFieldEnum | MemberScalarFieldEnum[]
  }

  /**
   * Member create
   */
  export type MemberCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * The data needed to create a Member.
     */
    data: XOR<MemberCreateInput, MemberUncheckedCreateInput>
  }

  /**
   * Member createMany
   */
  export type MemberCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Members.
     */
    data: MemberCreateManyInput | MemberCreateManyInput[]
  }

  /**
   * Member createManyAndReturn
   */
  export type MemberCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * The data used to create many Members.
     */
    data: MemberCreateManyInput | MemberCreateManyInput[]
  }

  /**
   * Member update
   */
  export type MemberUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * The data needed to update a Member.
     */
    data: XOR<MemberUpdateInput, MemberUncheckedUpdateInput>
    /**
     * Choose, which Member to update.
     */
    where: MemberWhereUniqueInput
  }

  /**
   * Member updateMany
   */
  export type MemberUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Members.
     */
    data: XOR<MemberUpdateManyMutationInput, MemberUncheckedUpdateManyInput>
    /**
     * Filter which Members to update
     */
    where?: MemberWhereInput
    /**
     * Limit how many Members to update.
     */
    limit?: number
  }

  /**
   * Member updateManyAndReturn
   */
  export type MemberUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * The data used to update Members.
     */
    data: XOR<MemberUpdateManyMutationInput, MemberUncheckedUpdateManyInput>
    /**
     * Filter which Members to update
     */
    where?: MemberWhereInput
    /**
     * Limit how many Members to update.
     */
    limit?: number
  }

  /**
   * Member upsert
   */
  export type MemberUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * The filter to search for the Member to update in case it exists.
     */
    where: MemberWhereUniqueInput
    /**
     * In case the Member found by the `where` argument doesn't exist, create a new Member with this data.
     */
    create: XOR<MemberCreateInput, MemberUncheckedCreateInput>
    /**
     * In case the Member was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MemberUpdateInput, MemberUncheckedUpdateInput>
  }

  /**
   * Member delete
   */
  export type MemberDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
    /**
     * Filter which Member to delete.
     */
    where: MemberWhereUniqueInput
  }

  /**
   * Member deleteMany
   */
  export type MemberDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Members to delete
     */
    where?: MemberWhereInput
    /**
     * Limit how many Members to delete.
     */
    limit?: number
  }

  /**
   * Member.roles
   */
  export type Member$rolesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleInclude<ExtArgs> | null
    where?: MemberRoleWhereInput
    orderBy?: MemberRoleOrderByWithRelationInput | MemberRoleOrderByWithRelationInput[]
    cursor?: MemberRoleWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MemberRoleScalarFieldEnum | MemberRoleScalarFieldEnum[]
  }

  /**
   * Member.wallet
   */
  export type Member$walletArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    where?: WalletWhereInput
  }

  /**
   * Member.transactionsSent
   */
  export type Member$transactionsSentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Member.transactionsReceived
   */
  export type Member$transactionsReceivedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Member.rewardsSent
   */
  export type Member$rewardsSentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardInclude<ExtArgs> | null
    where?: RewardWhereInput
    orderBy?: RewardOrderByWithRelationInput | RewardOrderByWithRelationInput[]
    cursor?: RewardWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RewardScalarFieldEnum | RewardScalarFieldEnum[]
  }

  /**
   * Member.rewardsReceived
   */
  export type Member$rewardsReceivedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardInclude<ExtArgs> | null
    where?: RewardWhereInput
    orderBy?: RewardOrderByWithRelationInput | RewardOrderByWithRelationInput[]
    cursor?: RewardWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RewardScalarFieldEnum | RewardScalarFieldEnum[]
  }

  /**
   * Member.evaluationsGiven
   */
  export type Member$evaluationsGivenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationInclude<ExtArgs> | null
    where?: EvaluationWhereInput
    orderBy?: EvaluationOrderByWithRelationInput | EvaluationOrderByWithRelationInput[]
    cursor?: EvaluationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EvaluationScalarFieldEnum | EvaluationScalarFieldEnum[]
  }

  /**
   * Member.relationshipsFrom
   */
  export type Member$relationshipsFromArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthInclude<ExtArgs> | null
    where?: RelationshipStrengthWhereInput
    orderBy?: RelationshipStrengthOrderByWithRelationInput | RelationshipStrengthOrderByWithRelationInput[]
    cursor?: RelationshipStrengthWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RelationshipStrengthScalarFieldEnum | RelationshipStrengthScalarFieldEnum[]
  }

  /**
   * Member.relationshipsTo
   */
  export type Member$relationshipsToArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthInclude<ExtArgs> | null
    where?: RelationshipStrengthWhereInput
    orderBy?: RelationshipStrengthOrderByWithRelationInput | RelationshipStrengthOrderByWithRelationInput[]
    cursor?: RelationshipStrengthWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RelationshipStrengthScalarFieldEnum | RelationshipStrengthScalarFieldEnum[]
  }

  /**
   * Member without action
   */
  export type MemberDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Member
     */
    select?: MemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Member
     */
    omit?: MemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberInclude<ExtArgs> | null
  }


  /**
   * Model MemberRole
   */

  export type AggregateMemberRole = {
    _count: MemberRoleCountAggregateOutputType | null
    _min: MemberRoleMinAggregateOutputType | null
    _max: MemberRoleMaxAggregateOutputType | null
  }

  export type MemberRoleMinAggregateOutputType = {
    id: string | null
    memberId: string | null
    role: $Enums.Role | null
  }

  export type MemberRoleMaxAggregateOutputType = {
    id: string | null
    memberId: string | null
    role: $Enums.Role | null
  }

  export type MemberRoleCountAggregateOutputType = {
    id: number
    memberId: number
    role: number
    _all: number
  }


  export type MemberRoleMinAggregateInputType = {
    id?: true
    memberId?: true
    role?: true
  }

  export type MemberRoleMaxAggregateInputType = {
    id?: true
    memberId?: true
    role?: true
  }

  export type MemberRoleCountAggregateInputType = {
    id?: true
    memberId?: true
    role?: true
    _all?: true
  }

  export type MemberRoleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MemberRole to aggregate.
     */
    where?: MemberRoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MemberRoles to fetch.
     */
    orderBy?: MemberRoleOrderByWithRelationInput | MemberRoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MemberRoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MemberRoles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MemberRoles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MemberRoles
    **/
    _count?: true | MemberRoleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MemberRoleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MemberRoleMaxAggregateInputType
  }

  export type GetMemberRoleAggregateType<T extends MemberRoleAggregateArgs> = {
        [P in keyof T & keyof AggregateMemberRole]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMemberRole[P]>
      : GetScalarType<T[P], AggregateMemberRole[P]>
  }




  export type MemberRoleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MemberRoleWhereInput
    orderBy?: MemberRoleOrderByWithAggregationInput | MemberRoleOrderByWithAggregationInput[]
    by: MemberRoleScalarFieldEnum[] | MemberRoleScalarFieldEnum
    having?: MemberRoleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MemberRoleCountAggregateInputType | true
    _min?: MemberRoleMinAggregateInputType
    _max?: MemberRoleMaxAggregateInputType
  }

  export type MemberRoleGroupByOutputType = {
    id: string
    memberId: string
    role: $Enums.Role
    _count: MemberRoleCountAggregateOutputType | null
    _min: MemberRoleMinAggregateOutputType | null
    _max: MemberRoleMaxAggregateOutputType | null
  }

  type GetMemberRoleGroupByPayload<T extends MemberRoleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MemberRoleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MemberRoleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MemberRoleGroupByOutputType[P]>
            : GetScalarType<T[P], MemberRoleGroupByOutputType[P]>
        }
      >
    >


  export type MemberRoleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    memberId?: boolean
    role?: boolean
    member?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["memberRole"]>

  export type MemberRoleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    memberId?: boolean
    role?: boolean
    member?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["memberRole"]>

  export type MemberRoleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    memberId?: boolean
    role?: boolean
    member?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["memberRole"]>

  export type MemberRoleSelectScalar = {
    id?: boolean
    memberId?: boolean
    role?: boolean
  }

  export type MemberRoleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "memberId" | "role", ExtArgs["result"]["memberRole"]>
  export type MemberRoleInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    member?: boolean | MemberDefaultArgs<ExtArgs>
  }
  export type MemberRoleIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    member?: boolean | MemberDefaultArgs<ExtArgs>
  }
  export type MemberRoleIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    member?: boolean | MemberDefaultArgs<ExtArgs>
  }

  export type $MemberRolePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MemberRole"
    objects: {
      member: Prisma.$MemberPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      memberId: string
      role: $Enums.Role
    }, ExtArgs["result"]["memberRole"]>
    composites: {}
  }

  type MemberRoleGetPayload<S extends boolean | null | undefined | MemberRoleDefaultArgs> = $Result.GetResult<Prisma.$MemberRolePayload, S>

  type MemberRoleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MemberRoleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MemberRoleCountAggregateInputType | true
    }

  export interface MemberRoleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MemberRole'], meta: { name: 'MemberRole' } }
    /**
     * Find zero or one MemberRole that matches the filter.
     * @param {MemberRoleFindUniqueArgs} args - Arguments to find a MemberRole
     * @example
     * // Get one MemberRole
     * const memberRole = await prisma.memberRole.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MemberRoleFindUniqueArgs>(args: SelectSubset<T, MemberRoleFindUniqueArgs<ExtArgs>>): Prisma__MemberRoleClient<$Result.GetResult<Prisma.$MemberRolePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MemberRole that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MemberRoleFindUniqueOrThrowArgs} args - Arguments to find a MemberRole
     * @example
     * // Get one MemberRole
     * const memberRole = await prisma.memberRole.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MemberRoleFindUniqueOrThrowArgs>(args: SelectSubset<T, MemberRoleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MemberRoleClient<$Result.GetResult<Prisma.$MemberRolePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MemberRole that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberRoleFindFirstArgs} args - Arguments to find a MemberRole
     * @example
     * // Get one MemberRole
     * const memberRole = await prisma.memberRole.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MemberRoleFindFirstArgs>(args?: SelectSubset<T, MemberRoleFindFirstArgs<ExtArgs>>): Prisma__MemberRoleClient<$Result.GetResult<Prisma.$MemberRolePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MemberRole that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberRoleFindFirstOrThrowArgs} args - Arguments to find a MemberRole
     * @example
     * // Get one MemberRole
     * const memberRole = await prisma.memberRole.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MemberRoleFindFirstOrThrowArgs>(args?: SelectSubset<T, MemberRoleFindFirstOrThrowArgs<ExtArgs>>): Prisma__MemberRoleClient<$Result.GetResult<Prisma.$MemberRolePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MemberRoles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberRoleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MemberRoles
     * const memberRoles = await prisma.memberRole.findMany()
     * 
     * // Get first 10 MemberRoles
     * const memberRoles = await prisma.memberRole.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const memberRoleWithIdOnly = await prisma.memberRole.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MemberRoleFindManyArgs>(args?: SelectSubset<T, MemberRoleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MemberRolePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MemberRole.
     * @param {MemberRoleCreateArgs} args - Arguments to create a MemberRole.
     * @example
     * // Create one MemberRole
     * const MemberRole = await prisma.memberRole.create({
     *   data: {
     *     // ... data to create a MemberRole
     *   }
     * })
     * 
     */
    create<T extends MemberRoleCreateArgs>(args: SelectSubset<T, MemberRoleCreateArgs<ExtArgs>>): Prisma__MemberRoleClient<$Result.GetResult<Prisma.$MemberRolePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MemberRoles.
     * @param {MemberRoleCreateManyArgs} args - Arguments to create many MemberRoles.
     * @example
     * // Create many MemberRoles
     * const memberRole = await prisma.memberRole.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MemberRoleCreateManyArgs>(args?: SelectSubset<T, MemberRoleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MemberRoles and returns the data saved in the database.
     * @param {MemberRoleCreateManyAndReturnArgs} args - Arguments to create many MemberRoles.
     * @example
     * // Create many MemberRoles
     * const memberRole = await prisma.memberRole.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MemberRoles and only return the `id`
     * const memberRoleWithIdOnly = await prisma.memberRole.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MemberRoleCreateManyAndReturnArgs>(args?: SelectSubset<T, MemberRoleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MemberRolePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MemberRole.
     * @param {MemberRoleDeleteArgs} args - Arguments to delete one MemberRole.
     * @example
     * // Delete one MemberRole
     * const MemberRole = await prisma.memberRole.delete({
     *   where: {
     *     // ... filter to delete one MemberRole
     *   }
     * })
     * 
     */
    delete<T extends MemberRoleDeleteArgs>(args: SelectSubset<T, MemberRoleDeleteArgs<ExtArgs>>): Prisma__MemberRoleClient<$Result.GetResult<Prisma.$MemberRolePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MemberRole.
     * @param {MemberRoleUpdateArgs} args - Arguments to update one MemberRole.
     * @example
     * // Update one MemberRole
     * const memberRole = await prisma.memberRole.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MemberRoleUpdateArgs>(args: SelectSubset<T, MemberRoleUpdateArgs<ExtArgs>>): Prisma__MemberRoleClient<$Result.GetResult<Prisma.$MemberRolePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MemberRoles.
     * @param {MemberRoleDeleteManyArgs} args - Arguments to filter MemberRoles to delete.
     * @example
     * // Delete a few MemberRoles
     * const { count } = await prisma.memberRole.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MemberRoleDeleteManyArgs>(args?: SelectSubset<T, MemberRoleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MemberRoles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberRoleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MemberRoles
     * const memberRole = await prisma.memberRole.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MemberRoleUpdateManyArgs>(args: SelectSubset<T, MemberRoleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MemberRoles and returns the data updated in the database.
     * @param {MemberRoleUpdateManyAndReturnArgs} args - Arguments to update many MemberRoles.
     * @example
     * // Update many MemberRoles
     * const memberRole = await prisma.memberRole.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MemberRoles and only return the `id`
     * const memberRoleWithIdOnly = await prisma.memberRole.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MemberRoleUpdateManyAndReturnArgs>(args: SelectSubset<T, MemberRoleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MemberRolePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MemberRole.
     * @param {MemberRoleUpsertArgs} args - Arguments to update or create a MemberRole.
     * @example
     * // Update or create a MemberRole
     * const memberRole = await prisma.memberRole.upsert({
     *   create: {
     *     // ... data to create a MemberRole
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MemberRole we want to update
     *   }
     * })
     */
    upsert<T extends MemberRoleUpsertArgs>(args: SelectSubset<T, MemberRoleUpsertArgs<ExtArgs>>): Prisma__MemberRoleClient<$Result.GetResult<Prisma.$MemberRolePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MemberRoles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberRoleCountArgs} args - Arguments to filter MemberRoles to count.
     * @example
     * // Count the number of MemberRoles
     * const count = await prisma.memberRole.count({
     *   where: {
     *     // ... the filter for the MemberRoles we want to count
     *   }
     * })
    **/
    count<T extends MemberRoleCountArgs>(
      args?: Subset<T, MemberRoleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MemberRoleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MemberRole.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberRoleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MemberRoleAggregateArgs>(args: Subset<T, MemberRoleAggregateArgs>): Prisma.PrismaPromise<GetMemberRoleAggregateType<T>>

    /**
     * Group by MemberRole.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MemberRoleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MemberRoleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MemberRoleGroupByArgs['orderBy'] }
        : { orderBy?: MemberRoleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MemberRoleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMemberRoleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MemberRole model
   */
  readonly fields: MemberRoleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MemberRole.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MemberRoleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    member<T extends MemberDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MemberDefaultArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MemberRole model
   */
  interface MemberRoleFieldRefs {
    readonly id: FieldRef<"MemberRole", 'String'>
    readonly memberId: FieldRef<"MemberRole", 'String'>
    readonly role: FieldRef<"MemberRole", 'Role'>
  }
    

  // Custom InputTypes
  /**
   * MemberRole findUnique
   */
  export type MemberRoleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleInclude<ExtArgs> | null
    /**
     * Filter, which MemberRole to fetch.
     */
    where: MemberRoleWhereUniqueInput
  }

  /**
   * MemberRole findUniqueOrThrow
   */
  export type MemberRoleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleInclude<ExtArgs> | null
    /**
     * Filter, which MemberRole to fetch.
     */
    where: MemberRoleWhereUniqueInput
  }

  /**
   * MemberRole findFirst
   */
  export type MemberRoleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleInclude<ExtArgs> | null
    /**
     * Filter, which MemberRole to fetch.
     */
    where?: MemberRoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MemberRoles to fetch.
     */
    orderBy?: MemberRoleOrderByWithRelationInput | MemberRoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MemberRoles.
     */
    cursor?: MemberRoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MemberRoles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MemberRoles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MemberRoles.
     */
    distinct?: MemberRoleScalarFieldEnum | MemberRoleScalarFieldEnum[]
  }

  /**
   * MemberRole findFirstOrThrow
   */
  export type MemberRoleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleInclude<ExtArgs> | null
    /**
     * Filter, which MemberRole to fetch.
     */
    where?: MemberRoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MemberRoles to fetch.
     */
    orderBy?: MemberRoleOrderByWithRelationInput | MemberRoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MemberRoles.
     */
    cursor?: MemberRoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MemberRoles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MemberRoles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MemberRoles.
     */
    distinct?: MemberRoleScalarFieldEnum | MemberRoleScalarFieldEnum[]
  }

  /**
   * MemberRole findMany
   */
  export type MemberRoleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleInclude<ExtArgs> | null
    /**
     * Filter, which MemberRoles to fetch.
     */
    where?: MemberRoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MemberRoles to fetch.
     */
    orderBy?: MemberRoleOrderByWithRelationInput | MemberRoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MemberRoles.
     */
    cursor?: MemberRoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MemberRoles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MemberRoles.
     */
    skip?: number
    distinct?: MemberRoleScalarFieldEnum | MemberRoleScalarFieldEnum[]
  }

  /**
   * MemberRole create
   */
  export type MemberRoleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleInclude<ExtArgs> | null
    /**
     * The data needed to create a MemberRole.
     */
    data: XOR<MemberRoleCreateInput, MemberRoleUncheckedCreateInput>
  }

  /**
   * MemberRole createMany
   */
  export type MemberRoleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MemberRoles.
     */
    data: MemberRoleCreateManyInput | MemberRoleCreateManyInput[]
  }

  /**
   * MemberRole createManyAndReturn
   */
  export type MemberRoleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * The data used to create many MemberRoles.
     */
    data: MemberRoleCreateManyInput | MemberRoleCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * MemberRole update
   */
  export type MemberRoleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleInclude<ExtArgs> | null
    /**
     * The data needed to update a MemberRole.
     */
    data: XOR<MemberRoleUpdateInput, MemberRoleUncheckedUpdateInput>
    /**
     * Choose, which MemberRole to update.
     */
    where: MemberRoleWhereUniqueInput
  }

  /**
   * MemberRole updateMany
   */
  export type MemberRoleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MemberRoles.
     */
    data: XOR<MemberRoleUpdateManyMutationInput, MemberRoleUncheckedUpdateManyInput>
    /**
     * Filter which MemberRoles to update
     */
    where?: MemberRoleWhereInput
    /**
     * Limit how many MemberRoles to update.
     */
    limit?: number
  }

  /**
   * MemberRole updateManyAndReturn
   */
  export type MemberRoleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * The data used to update MemberRoles.
     */
    data: XOR<MemberRoleUpdateManyMutationInput, MemberRoleUncheckedUpdateManyInput>
    /**
     * Filter which MemberRoles to update
     */
    where?: MemberRoleWhereInput
    /**
     * Limit how many MemberRoles to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * MemberRole upsert
   */
  export type MemberRoleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleInclude<ExtArgs> | null
    /**
     * The filter to search for the MemberRole to update in case it exists.
     */
    where: MemberRoleWhereUniqueInput
    /**
     * In case the MemberRole found by the `where` argument doesn't exist, create a new MemberRole with this data.
     */
    create: XOR<MemberRoleCreateInput, MemberRoleUncheckedCreateInput>
    /**
     * In case the MemberRole was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MemberRoleUpdateInput, MemberRoleUncheckedUpdateInput>
  }

  /**
   * MemberRole delete
   */
  export type MemberRoleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleInclude<ExtArgs> | null
    /**
     * Filter which MemberRole to delete.
     */
    where: MemberRoleWhereUniqueInput
  }

  /**
   * MemberRole deleteMany
   */
  export type MemberRoleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MemberRoles to delete
     */
    where?: MemberRoleWhereInput
    /**
     * Limit how many MemberRoles to delete.
     */
    limit?: number
  }

  /**
   * MemberRole without action
   */
  export type MemberRoleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MemberRole
     */
    select?: MemberRoleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MemberRole
     */
    omit?: MemberRoleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MemberRoleInclude<ExtArgs> | null
  }


  /**
   * Model Wallet
   */

  export type AggregateWallet = {
    _count: WalletCountAggregateOutputType | null
    _avg: WalletAvgAggregateOutputType | null
    _sum: WalletSumAggregateOutputType | null
    _min: WalletMinAggregateOutputType | null
    _max: WalletMaxAggregateOutputType | null
  }

  export type WalletAvgAggregateOutputType = {
    balance: number | null
  }

  export type WalletSumAggregateOutputType = {
    balance: number | null
  }

  export type WalletMinAggregateOutputType = {
    id: string | null
    memberId: string | null
    currency: string | null
    balance: number | null
  }

  export type WalletMaxAggregateOutputType = {
    id: string | null
    memberId: string | null
    currency: string | null
    balance: number | null
  }

  export type WalletCountAggregateOutputType = {
    id: number
    memberId: number
    currency: number
    balance: number
    _all: number
  }


  export type WalletAvgAggregateInputType = {
    balance?: true
  }

  export type WalletSumAggregateInputType = {
    balance?: true
  }

  export type WalletMinAggregateInputType = {
    id?: true
    memberId?: true
    currency?: true
    balance?: true
  }

  export type WalletMaxAggregateInputType = {
    id?: true
    memberId?: true
    currency?: true
    balance?: true
  }

  export type WalletCountAggregateInputType = {
    id?: true
    memberId?: true
    currency?: true
    balance?: true
    _all?: true
  }

  export type WalletAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Wallet to aggregate.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Wallets
    **/
    _count?: true | WalletCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WalletAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WalletSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WalletMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WalletMaxAggregateInputType
  }

  export type GetWalletAggregateType<T extends WalletAggregateArgs> = {
        [P in keyof T & keyof AggregateWallet]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWallet[P]>
      : GetScalarType<T[P], AggregateWallet[P]>
  }




  export type WalletGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WalletWhereInput
    orderBy?: WalletOrderByWithAggregationInput | WalletOrderByWithAggregationInput[]
    by: WalletScalarFieldEnum[] | WalletScalarFieldEnum
    having?: WalletScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WalletCountAggregateInputType | true
    _avg?: WalletAvgAggregateInputType
    _sum?: WalletSumAggregateInputType
    _min?: WalletMinAggregateInputType
    _max?: WalletMaxAggregateInputType
  }

  export type WalletGroupByOutputType = {
    id: string
    memberId: string
    currency: string
    balance: number
    _count: WalletCountAggregateOutputType | null
    _avg: WalletAvgAggregateOutputType | null
    _sum: WalletSumAggregateOutputType | null
    _min: WalletMinAggregateOutputType | null
    _max: WalletMaxAggregateOutputType | null
  }

  type GetWalletGroupByPayload<T extends WalletGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WalletGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WalletGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WalletGroupByOutputType[P]>
            : GetScalarType<T[P], WalletGroupByOutputType[P]>
        }
      >
    >


  export type WalletSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    memberId?: boolean
    currency?: boolean
    balance?: boolean
    member?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["wallet"]>

  export type WalletSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    memberId?: boolean
    currency?: boolean
    balance?: boolean
    member?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["wallet"]>

  export type WalletSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    memberId?: boolean
    currency?: boolean
    balance?: boolean
    member?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["wallet"]>

  export type WalletSelectScalar = {
    id?: boolean
    memberId?: boolean
    currency?: boolean
    balance?: boolean
  }

  export type WalletOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "memberId" | "currency" | "balance", ExtArgs["result"]["wallet"]>
  export type WalletInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    member?: boolean | MemberDefaultArgs<ExtArgs>
  }
  export type WalletIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    member?: boolean | MemberDefaultArgs<ExtArgs>
  }
  export type WalletIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    member?: boolean | MemberDefaultArgs<ExtArgs>
  }

  export type $WalletPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Wallet"
    objects: {
      member: Prisma.$MemberPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      memberId: string
      currency: string
      balance: number
    }, ExtArgs["result"]["wallet"]>
    composites: {}
  }

  type WalletGetPayload<S extends boolean | null | undefined | WalletDefaultArgs> = $Result.GetResult<Prisma.$WalletPayload, S>

  type WalletCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WalletFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WalletCountAggregateInputType | true
    }

  export interface WalletDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Wallet'], meta: { name: 'Wallet' } }
    /**
     * Find zero or one Wallet that matches the filter.
     * @param {WalletFindUniqueArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WalletFindUniqueArgs>(args: SelectSubset<T, WalletFindUniqueArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Wallet that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WalletFindUniqueOrThrowArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WalletFindUniqueOrThrowArgs>(args: SelectSubset<T, WalletFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Wallet that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletFindFirstArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WalletFindFirstArgs>(args?: SelectSubset<T, WalletFindFirstArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Wallet that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletFindFirstOrThrowArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WalletFindFirstOrThrowArgs>(args?: SelectSubset<T, WalletFindFirstOrThrowArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Wallets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Wallets
     * const wallets = await prisma.wallet.findMany()
     * 
     * // Get first 10 Wallets
     * const wallets = await prisma.wallet.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const walletWithIdOnly = await prisma.wallet.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WalletFindManyArgs>(args?: SelectSubset<T, WalletFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Wallet.
     * @param {WalletCreateArgs} args - Arguments to create a Wallet.
     * @example
     * // Create one Wallet
     * const Wallet = await prisma.wallet.create({
     *   data: {
     *     // ... data to create a Wallet
     *   }
     * })
     * 
     */
    create<T extends WalletCreateArgs>(args: SelectSubset<T, WalletCreateArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Wallets.
     * @param {WalletCreateManyArgs} args - Arguments to create many Wallets.
     * @example
     * // Create many Wallets
     * const wallet = await prisma.wallet.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WalletCreateManyArgs>(args?: SelectSubset<T, WalletCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Wallets and returns the data saved in the database.
     * @param {WalletCreateManyAndReturnArgs} args - Arguments to create many Wallets.
     * @example
     * // Create many Wallets
     * const wallet = await prisma.wallet.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Wallets and only return the `id`
     * const walletWithIdOnly = await prisma.wallet.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WalletCreateManyAndReturnArgs>(args?: SelectSubset<T, WalletCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Wallet.
     * @param {WalletDeleteArgs} args - Arguments to delete one Wallet.
     * @example
     * // Delete one Wallet
     * const Wallet = await prisma.wallet.delete({
     *   where: {
     *     // ... filter to delete one Wallet
     *   }
     * })
     * 
     */
    delete<T extends WalletDeleteArgs>(args: SelectSubset<T, WalletDeleteArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Wallet.
     * @param {WalletUpdateArgs} args - Arguments to update one Wallet.
     * @example
     * // Update one Wallet
     * const wallet = await prisma.wallet.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WalletUpdateArgs>(args: SelectSubset<T, WalletUpdateArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Wallets.
     * @param {WalletDeleteManyArgs} args - Arguments to filter Wallets to delete.
     * @example
     * // Delete a few Wallets
     * const { count } = await prisma.wallet.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WalletDeleteManyArgs>(args?: SelectSubset<T, WalletDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Wallets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Wallets
     * const wallet = await prisma.wallet.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WalletUpdateManyArgs>(args: SelectSubset<T, WalletUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Wallets and returns the data updated in the database.
     * @param {WalletUpdateManyAndReturnArgs} args - Arguments to update many Wallets.
     * @example
     * // Update many Wallets
     * const wallet = await prisma.wallet.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Wallets and only return the `id`
     * const walletWithIdOnly = await prisma.wallet.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WalletUpdateManyAndReturnArgs>(args: SelectSubset<T, WalletUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Wallet.
     * @param {WalletUpsertArgs} args - Arguments to update or create a Wallet.
     * @example
     * // Update or create a Wallet
     * const wallet = await prisma.wallet.upsert({
     *   create: {
     *     // ... data to create a Wallet
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Wallet we want to update
     *   }
     * })
     */
    upsert<T extends WalletUpsertArgs>(args: SelectSubset<T, WalletUpsertArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Wallets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletCountArgs} args - Arguments to filter Wallets to count.
     * @example
     * // Count the number of Wallets
     * const count = await prisma.wallet.count({
     *   where: {
     *     // ... the filter for the Wallets we want to count
     *   }
     * })
    **/
    count<T extends WalletCountArgs>(
      args?: Subset<T, WalletCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WalletCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Wallet.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WalletAggregateArgs>(args: Subset<T, WalletAggregateArgs>): Prisma.PrismaPromise<GetWalletAggregateType<T>>

    /**
     * Group by Wallet.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WalletGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WalletGroupByArgs['orderBy'] }
        : { orderBy?: WalletGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WalletGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWalletGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Wallet model
   */
  readonly fields: WalletFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Wallet.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WalletClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    member<T extends MemberDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MemberDefaultArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Wallet model
   */
  interface WalletFieldRefs {
    readonly id: FieldRef<"Wallet", 'String'>
    readonly memberId: FieldRef<"Wallet", 'String'>
    readonly currency: FieldRef<"Wallet", 'String'>
    readonly balance: FieldRef<"Wallet", 'Float'>
  }
    

  // Custom InputTypes
  /**
   * Wallet findUnique
   */
  export type WalletFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet findUniqueOrThrow
   */
  export type WalletFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet findFirst
   */
  export type WalletFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Wallets.
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Wallets.
     */
    distinct?: WalletScalarFieldEnum | WalletScalarFieldEnum[]
  }

  /**
   * Wallet findFirstOrThrow
   */
  export type WalletFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Wallets.
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Wallets.
     */
    distinct?: WalletScalarFieldEnum | WalletScalarFieldEnum[]
  }

  /**
   * Wallet findMany
   */
  export type WalletFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallets to fetch.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Wallets.
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    distinct?: WalletScalarFieldEnum | WalletScalarFieldEnum[]
  }

  /**
   * Wallet create
   */
  export type WalletCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * The data needed to create a Wallet.
     */
    data: XOR<WalletCreateInput, WalletUncheckedCreateInput>
  }

  /**
   * Wallet createMany
   */
  export type WalletCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Wallets.
     */
    data: WalletCreateManyInput | WalletCreateManyInput[]
  }

  /**
   * Wallet createManyAndReturn
   */
  export type WalletCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * The data used to create many Wallets.
     */
    data: WalletCreateManyInput | WalletCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Wallet update
   */
  export type WalletUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * The data needed to update a Wallet.
     */
    data: XOR<WalletUpdateInput, WalletUncheckedUpdateInput>
    /**
     * Choose, which Wallet to update.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet updateMany
   */
  export type WalletUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Wallets.
     */
    data: XOR<WalletUpdateManyMutationInput, WalletUncheckedUpdateManyInput>
    /**
     * Filter which Wallets to update
     */
    where?: WalletWhereInput
    /**
     * Limit how many Wallets to update.
     */
    limit?: number
  }

  /**
   * Wallet updateManyAndReturn
   */
  export type WalletUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * The data used to update Wallets.
     */
    data: XOR<WalletUpdateManyMutationInput, WalletUncheckedUpdateManyInput>
    /**
     * Filter which Wallets to update
     */
    where?: WalletWhereInput
    /**
     * Limit how many Wallets to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Wallet upsert
   */
  export type WalletUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * The filter to search for the Wallet to update in case it exists.
     */
    where: WalletWhereUniqueInput
    /**
     * In case the Wallet found by the `where` argument doesn't exist, create a new Wallet with this data.
     */
    create: XOR<WalletCreateInput, WalletUncheckedCreateInput>
    /**
     * In case the Wallet was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WalletUpdateInput, WalletUncheckedUpdateInput>
  }

  /**
   * Wallet delete
   */
  export type WalletDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter which Wallet to delete.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet deleteMany
   */
  export type WalletDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Wallets to delete
     */
    where?: WalletWhereInput
    /**
     * Limit how many Wallets to delete.
     */
    limit?: number
  }

  /**
   * Wallet without action
   */
  export type WalletDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
  }


  /**
   * Model Transaction
   */

  export type AggregateTransaction = {
    _count: TransactionCountAggregateOutputType | null
    _avg: TransactionAvgAggregateOutputType | null
    _sum: TransactionSumAggregateOutputType | null
    _min: TransactionMinAggregateOutputType | null
    _max: TransactionMaxAggregateOutputType | null
  }

  export type TransactionAvgAggregateOutputType = {
    amount: number | null
  }

  export type TransactionSumAggregateOutputType = {
    amount: number | null
  }

  export type TransactionMinAggregateOutputType = {
    id: string | null
    senderId: string | null
    recipientId: string | null
    amount: number | null
    currency: string | null
    note: string | null
    isPrivate: boolean | null
    createdAt: Date | null
  }

  export type TransactionMaxAggregateOutputType = {
    id: string | null
    senderId: string | null
    recipientId: string | null
    amount: number | null
    currency: string | null
    note: string | null
    isPrivate: boolean | null
    createdAt: Date | null
  }

  export type TransactionCountAggregateOutputType = {
    id: number
    senderId: number
    recipientId: number
    amount: number
    currency: number
    note: number
    isPrivate: number
    createdAt: number
    _all: number
  }


  export type TransactionAvgAggregateInputType = {
    amount?: true
  }

  export type TransactionSumAggregateInputType = {
    amount?: true
  }

  export type TransactionMinAggregateInputType = {
    id?: true
    senderId?: true
    recipientId?: true
    amount?: true
    currency?: true
    note?: true
    isPrivate?: true
    createdAt?: true
  }

  export type TransactionMaxAggregateInputType = {
    id?: true
    senderId?: true
    recipientId?: true
    amount?: true
    currency?: true
    note?: true
    isPrivate?: true
    createdAt?: true
  }

  export type TransactionCountAggregateInputType = {
    id?: true
    senderId?: true
    recipientId?: true
    amount?: true
    currency?: true
    note?: true
    isPrivate?: true
    createdAt?: true
    _all?: true
  }

  export type TransactionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Transaction to aggregate.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Transactions
    **/
    _count?: true | TransactionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TransactionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TransactionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TransactionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TransactionMaxAggregateInputType
  }

  export type GetTransactionAggregateType<T extends TransactionAggregateArgs> = {
        [P in keyof T & keyof AggregateTransaction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTransaction[P]>
      : GetScalarType<T[P], AggregateTransaction[P]>
  }




  export type TransactionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithAggregationInput | TransactionOrderByWithAggregationInput[]
    by: TransactionScalarFieldEnum[] | TransactionScalarFieldEnum
    having?: TransactionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TransactionCountAggregateInputType | true
    _avg?: TransactionAvgAggregateInputType
    _sum?: TransactionSumAggregateInputType
    _min?: TransactionMinAggregateInputType
    _max?: TransactionMaxAggregateInputType
  }

  export type TransactionGroupByOutputType = {
    id: string
    senderId: string
    recipientId: string
    amount: number
    currency: string
    note: string | null
    isPrivate: boolean
    createdAt: Date
    _count: TransactionCountAggregateOutputType | null
    _avg: TransactionAvgAggregateOutputType | null
    _sum: TransactionSumAggregateOutputType | null
    _min: TransactionMinAggregateOutputType | null
    _max: TransactionMaxAggregateOutputType | null
  }

  type GetTransactionGroupByPayload<T extends TransactionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TransactionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TransactionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TransactionGroupByOutputType[P]>
            : GetScalarType<T[P], TransactionGroupByOutputType[P]>
        }
      >
    >


  export type TransactionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    senderId?: boolean
    recipientId?: boolean
    amount?: boolean
    currency?: boolean
    note?: boolean
    isPrivate?: boolean
    createdAt?: boolean
    sender?: boolean | MemberDefaultArgs<ExtArgs>
    recipient?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    senderId?: boolean
    recipientId?: boolean
    amount?: boolean
    currency?: boolean
    note?: boolean
    isPrivate?: boolean
    createdAt?: boolean
    sender?: boolean | MemberDefaultArgs<ExtArgs>
    recipient?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    senderId?: boolean
    recipientId?: boolean
    amount?: boolean
    currency?: boolean
    note?: boolean
    isPrivate?: boolean
    createdAt?: boolean
    sender?: boolean | MemberDefaultArgs<ExtArgs>
    recipient?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectScalar = {
    id?: boolean
    senderId?: boolean
    recipientId?: boolean
    amount?: boolean
    currency?: boolean
    note?: boolean
    isPrivate?: boolean
    createdAt?: boolean
  }

  export type TransactionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "senderId" | "recipientId" | "amount" | "currency" | "note" | "isPrivate" | "createdAt", ExtArgs["result"]["transaction"]>
  export type TransactionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | MemberDefaultArgs<ExtArgs>
    recipient?: boolean | MemberDefaultArgs<ExtArgs>
  }
  export type TransactionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | MemberDefaultArgs<ExtArgs>
    recipient?: boolean | MemberDefaultArgs<ExtArgs>
  }
  export type TransactionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | MemberDefaultArgs<ExtArgs>
    recipient?: boolean | MemberDefaultArgs<ExtArgs>
  }

  export type $TransactionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Transaction"
    objects: {
      sender: Prisma.$MemberPayload<ExtArgs>
      recipient: Prisma.$MemberPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      senderId: string
      recipientId: string
      amount: number
      currency: string
      note: string | null
      isPrivate: boolean
      createdAt: Date
    }, ExtArgs["result"]["transaction"]>
    composites: {}
  }

  type TransactionGetPayload<S extends boolean | null | undefined | TransactionDefaultArgs> = $Result.GetResult<Prisma.$TransactionPayload, S>

  type TransactionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TransactionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TransactionCountAggregateInputType | true
    }

  export interface TransactionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Transaction'], meta: { name: 'Transaction' } }
    /**
     * Find zero or one Transaction that matches the filter.
     * @param {TransactionFindUniqueArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TransactionFindUniqueArgs>(args: SelectSubset<T, TransactionFindUniqueArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Transaction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TransactionFindUniqueOrThrowArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TransactionFindUniqueOrThrowArgs>(args: SelectSubset<T, TransactionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Transaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindFirstArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TransactionFindFirstArgs>(args?: SelectSubset<T, TransactionFindFirstArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Transaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindFirstOrThrowArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TransactionFindFirstOrThrowArgs>(args?: SelectSubset<T, TransactionFindFirstOrThrowArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Transactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Transactions
     * const transactions = await prisma.transaction.findMany()
     * 
     * // Get first 10 Transactions
     * const transactions = await prisma.transaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const transactionWithIdOnly = await prisma.transaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TransactionFindManyArgs>(args?: SelectSubset<T, TransactionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Transaction.
     * @param {TransactionCreateArgs} args - Arguments to create a Transaction.
     * @example
     * // Create one Transaction
     * const Transaction = await prisma.transaction.create({
     *   data: {
     *     // ... data to create a Transaction
     *   }
     * })
     * 
     */
    create<T extends TransactionCreateArgs>(args: SelectSubset<T, TransactionCreateArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Transactions.
     * @param {TransactionCreateManyArgs} args - Arguments to create many Transactions.
     * @example
     * // Create many Transactions
     * const transaction = await prisma.transaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TransactionCreateManyArgs>(args?: SelectSubset<T, TransactionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Transactions and returns the data saved in the database.
     * @param {TransactionCreateManyAndReturnArgs} args - Arguments to create many Transactions.
     * @example
     * // Create many Transactions
     * const transaction = await prisma.transaction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Transactions and only return the `id`
     * const transactionWithIdOnly = await prisma.transaction.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TransactionCreateManyAndReturnArgs>(args?: SelectSubset<T, TransactionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Transaction.
     * @param {TransactionDeleteArgs} args - Arguments to delete one Transaction.
     * @example
     * // Delete one Transaction
     * const Transaction = await prisma.transaction.delete({
     *   where: {
     *     // ... filter to delete one Transaction
     *   }
     * })
     * 
     */
    delete<T extends TransactionDeleteArgs>(args: SelectSubset<T, TransactionDeleteArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Transaction.
     * @param {TransactionUpdateArgs} args - Arguments to update one Transaction.
     * @example
     * // Update one Transaction
     * const transaction = await prisma.transaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TransactionUpdateArgs>(args: SelectSubset<T, TransactionUpdateArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Transactions.
     * @param {TransactionDeleteManyArgs} args - Arguments to filter Transactions to delete.
     * @example
     * // Delete a few Transactions
     * const { count } = await prisma.transaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TransactionDeleteManyArgs>(args?: SelectSubset<T, TransactionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Transactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Transactions
     * const transaction = await prisma.transaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TransactionUpdateManyArgs>(args: SelectSubset<T, TransactionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Transactions and returns the data updated in the database.
     * @param {TransactionUpdateManyAndReturnArgs} args - Arguments to update many Transactions.
     * @example
     * // Update many Transactions
     * const transaction = await prisma.transaction.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Transactions and only return the `id`
     * const transactionWithIdOnly = await prisma.transaction.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TransactionUpdateManyAndReturnArgs>(args: SelectSubset<T, TransactionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Transaction.
     * @param {TransactionUpsertArgs} args - Arguments to update or create a Transaction.
     * @example
     * // Update or create a Transaction
     * const transaction = await prisma.transaction.upsert({
     *   create: {
     *     // ... data to create a Transaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Transaction we want to update
     *   }
     * })
     */
    upsert<T extends TransactionUpsertArgs>(args: SelectSubset<T, TransactionUpsertArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Transactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionCountArgs} args - Arguments to filter Transactions to count.
     * @example
     * // Count the number of Transactions
     * const count = await prisma.transaction.count({
     *   where: {
     *     // ... the filter for the Transactions we want to count
     *   }
     * })
    **/
    count<T extends TransactionCountArgs>(
      args?: Subset<T, TransactionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TransactionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Transaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TransactionAggregateArgs>(args: Subset<T, TransactionAggregateArgs>): Prisma.PrismaPromise<GetTransactionAggregateType<T>>

    /**
     * Group by Transaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TransactionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TransactionGroupByArgs['orderBy'] }
        : { orderBy?: TransactionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TransactionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTransactionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Transaction model
   */
  readonly fields: TransactionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Transaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TransactionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sender<T extends MemberDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MemberDefaultArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    recipient<T extends MemberDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MemberDefaultArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Transaction model
   */
  interface TransactionFieldRefs {
    readonly id: FieldRef<"Transaction", 'String'>
    readonly senderId: FieldRef<"Transaction", 'String'>
    readonly recipientId: FieldRef<"Transaction", 'String'>
    readonly amount: FieldRef<"Transaction", 'Float'>
    readonly currency: FieldRef<"Transaction", 'String'>
    readonly note: FieldRef<"Transaction", 'String'>
    readonly isPrivate: FieldRef<"Transaction", 'Boolean'>
    readonly createdAt: FieldRef<"Transaction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Transaction findUnique
   */
  export type TransactionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction findUniqueOrThrow
   */
  export type TransactionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction findFirst
   */
  export type TransactionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Transactions.
     */
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction findFirstOrThrow
   */
  export type TransactionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Transactions.
     */
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction findMany
   */
  export type TransactionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transactions to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction create
   */
  export type TransactionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The data needed to create a Transaction.
     */
    data: XOR<TransactionCreateInput, TransactionUncheckedCreateInput>
  }

  /**
   * Transaction createMany
   */
  export type TransactionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Transactions.
     */
    data: TransactionCreateManyInput | TransactionCreateManyInput[]
  }

  /**
   * Transaction createManyAndReturn
   */
  export type TransactionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * The data used to create many Transactions.
     */
    data: TransactionCreateManyInput | TransactionCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Transaction update
   */
  export type TransactionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The data needed to update a Transaction.
     */
    data: XOR<TransactionUpdateInput, TransactionUncheckedUpdateInput>
    /**
     * Choose, which Transaction to update.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction updateMany
   */
  export type TransactionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Transactions.
     */
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyInput>
    /**
     * Filter which Transactions to update
     */
    where?: TransactionWhereInput
    /**
     * Limit how many Transactions to update.
     */
    limit?: number
  }

  /**
   * Transaction updateManyAndReturn
   */
  export type TransactionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * The data used to update Transactions.
     */
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyInput>
    /**
     * Filter which Transactions to update
     */
    where?: TransactionWhereInput
    /**
     * Limit how many Transactions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Transaction upsert
   */
  export type TransactionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The filter to search for the Transaction to update in case it exists.
     */
    where: TransactionWhereUniqueInput
    /**
     * In case the Transaction found by the `where` argument doesn't exist, create a new Transaction with this data.
     */
    create: XOR<TransactionCreateInput, TransactionUncheckedCreateInput>
    /**
     * In case the Transaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TransactionUpdateInput, TransactionUncheckedUpdateInput>
  }

  /**
   * Transaction delete
   */
  export type TransactionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter which Transaction to delete.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction deleteMany
   */
  export type TransactionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Transactions to delete
     */
    where?: TransactionWhereInput
    /**
     * Limit how many Transactions to delete.
     */
    limit?: number
  }

  /**
   * Transaction without action
   */
  export type TransactionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
  }


  /**
   * Model Reward
   */

  export type AggregateReward = {
    _count: RewardCountAggregateOutputType | null
    _avg: RewardAvgAggregateOutputType | null
    _sum: RewardSumAggregateOutputType | null
    _min: RewardMinAggregateOutputType | null
    _max: RewardMaxAggregateOutputType | null
  }

  export type RewardAvgAggregateOutputType = {
    amount: number | null
  }

  export type RewardSumAggregateOutputType = {
    amount: number | null
  }

  export type RewardMinAggregateOutputType = {
    id: string | null
    senderId: string | null
    recipientId: string | null
    amount: number | null
    currency: string | null
    note: string | null
    isRecurring: boolean | null
    createdAt: Date | null
  }

  export type RewardMaxAggregateOutputType = {
    id: string | null
    senderId: string | null
    recipientId: string | null
    amount: number | null
    currency: string | null
    note: string | null
    isRecurring: boolean | null
    createdAt: Date | null
  }

  export type RewardCountAggregateOutputType = {
    id: number
    senderId: number
    recipientId: number
    amount: number
    currency: number
    note: number
    isRecurring: number
    createdAt: number
    _all: number
  }


  export type RewardAvgAggregateInputType = {
    amount?: true
  }

  export type RewardSumAggregateInputType = {
    amount?: true
  }

  export type RewardMinAggregateInputType = {
    id?: true
    senderId?: true
    recipientId?: true
    amount?: true
    currency?: true
    note?: true
    isRecurring?: true
    createdAt?: true
  }

  export type RewardMaxAggregateInputType = {
    id?: true
    senderId?: true
    recipientId?: true
    amount?: true
    currency?: true
    note?: true
    isRecurring?: true
    createdAt?: true
  }

  export type RewardCountAggregateInputType = {
    id?: true
    senderId?: true
    recipientId?: true
    amount?: true
    currency?: true
    note?: true
    isRecurring?: true
    createdAt?: true
    _all?: true
  }

  export type RewardAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Reward to aggregate.
     */
    where?: RewardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rewards to fetch.
     */
    orderBy?: RewardOrderByWithRelationInput | RewardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RewardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rewards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rewards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Rewards
    **/
    _count?: true | RewardCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RewardAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RewardSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RewardMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RewardMaxAggregateInputType
  }

  export type GetRewardAggregateType<T extends RewardAggregateArgs> = {
        [P in keyof T & keyof AggregateReward]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReward[P]>
      : GetScalarType<T[P], AggregateReward[P]>
  }




  export type RewardGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RewardWhereInput
    orderBy?: RewardOrderByWithAggregationInput | RewardOrderByWithAggregationInput[]
    by: RewardScalarFieldEnum[] | RewardScalarFieldEnum
    having?: RewardScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RewardCountAggregateInputType | true
    _avg?: RewardAvgAggregateInputType
    _sum?: RewardSumAggregateInputType
    _min?: RewardMinAggregateInputType
    _max?: RewardMaxAggregateInputType
  }

  export type RewardGroupByOutputType = {
    id: string
    senderId: string
    recipientId: string
    amount: number
    currency: string
    note: string | null
    isRecurring: boolean
    createdAt: Date
    _count: RewardCountAggregateOutputType | null
    _avg: RewardAvgAggregateOutputType | null
    _sum: RewardSumAggregateOutputType | null
    _min: RewardMinAggregateOutputType | null
    _max: RewardMaxAggregateOutputType | null
  }

  type GetRewardGroupByPayload<T extends RewardGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RewardGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RewardGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RewardGroupByOutputType[P]>
            : GetScalarType<T[P], RewardGroupByOutputType[P]>
        }
      >
    >


  export type RewardSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    senderId?: boolean
    recipientId?: boolean
    amount?: boolean
    currency?: boolean
    note?: boolean
    isRecurring?: boolean
    createdAt?: boolean
    sender?: boolean | MemberDefaultArgs<ExtArgs>
    recipient?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["reward"]>

  export type RewardSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    senderId?: boolean
    recipientId?: boolean
    amount?: boolean
    currency?: boolean
    note?: boolean
    isRecurring?: boolean
    createdAt?: boolean
    sender?: boolean | MemberDefaultArgs<ExtArgs>
    recipient?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["reward"]>

  export type RewardSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    senderId?: boolean
    recipientId?: boolean
    amount?: boolean
    currency?: boolean
    note?: boolean
    isRecurring?: boolean
    createdAt?: boolean
    sender?: boolean | MemberDefaultArgs<ExtArgs>
    recipient?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["reward"]>

  export type RewardSelectScalar = {
    id?: boolean
    senderId?: boolean
    recipientId?: boolean
    amount?: boolean
    currency?: boolean
    note?: boolean
    isRecurring?: boolean
    createdAt?: boolean
  }

  export type RewardOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "senderId" | "recipientId" | "amount" | "currency" | "note" | "isRecurring" | "createdAt", ExtArgs["result"]["reward"]>
  export type RewardInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | MemberDefaultArgs<ExtArgs>
    recipient?: boolean | MemberDefaultArgs<ExtArgs>
  }
  export type RewardIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | MemberDefaultArgs<ExtArgs>
    recipient?: boolean | MemberDefaultArgs<ExtArgs>
  }
  export type RewardIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | MemberDefaultArgs<ExtArgs>
    recipient?: boolean | MemberDefaultArgs<ExtArgs>
  }

  export type $RewardPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Reward"
    objects: {
      sender: Prisma.$MemberPayload<ExtArgs>
      recipient: Prisma.$MemberPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      senderId: string
      recipientId: string
      amount: number
      currency: string
      note: string | null
      isRecurring: boolean
      createdAt: Date
    }, ExtArgs["result"]["reward"]>
    composites: {}
  }

  type RewardGetPayload<S extends boolean | null | undefined | RewardDefaultArgs> = $Result.GetResult<Prisma.$RewardPayload, S>

  type RewardCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RewardFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RewardCountAggregateInputType | true
    }

  export interface RewardDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Reward'], meta: { name: 'Reward' } }
    /**
     * Find zero or one Reward that matches the filter.
     * @param {RewardFindUniqueArgs} args - Arguments to find a Reward
     * @example
     * // Get one Reward
     * const reward = await prisma.reward.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RewardFindUniqueArgs>(args: SelectSubset<T, RewardFindUniqueArgs<ExtArgs>>): Prisma__RewardClient<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Reward that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RewardFindUniqueOrThrowArgs} args - Arguments to find a Reward
     * @example
     * // Get one Reward
     * const reward = await prisma.reward.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RewardFindUniqueOrThrowArgs>(args: SelectSubset<T, RewardFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RewardClient<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Reward that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RewardFindFirstArgs} args - Arguments to find a Reward
     * @example
     * // Get one Reward
     * const reward = await prisma.reward.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RewardFindFirstArgs>(args?: SelectSubset<T, RewardFindFirstArgs<ExtArgs>>): Prisma__RewardClient<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Reward that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RewardFindFirstOrThrowArgs} args - Arguments to find a Reward
     * @example
     * // Get one Reward
     * const reward = await prisma.reward.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RewardFindFirstOrThrowArgs>(args?: SelectSubset<T, RewardFindFirstOrThrowArgs<ExtArgs>>): Prisma__RewardClient<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Rewards that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RewardFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Rewards
     * const rewards = await prisma.reward.findMany()
     * 
     * // Get first 10 Rewards
     * const rewards = await prisma.reward.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const rewardWithIdOnly = await prisma.reward.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RewardFindManyArgs>(args?: SelectSubset<T, RewardFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Reward.
     * @param {RewardCreateArgs} args - Arguments to create a Reward.
     * @example
     * // Create one Reward
     * const Reward = await prisma.reward.create({
     *   data: {
     *     // ... data to create a Reward
     *   }
     * })
     * 
     */
    create<T extends RewardCreateArgs>(args: SelectSubset<T, RewardCreateArgs<ExtArgs>>): Prisma__RewardClient<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Rewards.
     * @param {RewardCreateManyArgs} args - Arguments to create many Rewards.
     * @example
     * // Create many Rewards
     * const reward = await prisma.reward.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RewardCreateManyArgs>(args?: SelectSubset<T, RewardCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Rewards and returns the data saved in the database.
     * @param {RewardCreateManyAndReturnArgs} args - Arguments to create many Rewards.
     * @example
     * // Create many Rewards
     * const reward = await prisma.reward.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Rewards and only return the `id`
     * const rewardWithIdOnly = await prisma.reward.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RewardCreateManyAndReturnArgs>(args?: SelectSubset<T, RewardCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Reward.
     * @param {RewardDeleteArgs} args - Arguments to delete one Reward.
     * @example
     * // Delete one Reward
     * const Reward = await prisma.reward.delete({
     *   where: {
     *     // ... filter to delete one Reward
     *   }
     * })
     * 
     */
    delete<T extends RewardDeleteArgs>(args: SelectSubset<T, RewardDeleteArgs<ExtArgs>>): Prisma__RewardClient<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Reward.
     * @param {RewardUpdateArgs} args - Arguments to update one Reward.
     * @example
     * // Update one Reward
     * const reward = await prisma.reward.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RewardUpdateArgs>(args: SelectSubset<T, RewardUpdateArgs<ExtArgs>>): Prisma__RewardClient<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Rewards.
     * @param {RewardDeleteManyArgs} args - Arguments to filter Rewards to delete.
     * @example
     * // Delete a few Rewards
     * const { count } = await prisma.reward.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RewardDeleteManyArgs>(args?: SelectSubset<T, RewardDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Rewards.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RewardUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Rewards
     * const reward = await prisma.reward.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RewardUpdateManyArgs>(args: SelectSubset<T, RewardUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Rewards and returns the data updated in the database.
     * @param {RewardUpdateManyAndReturnArgs} args - Arguments to update many Rewards.
     * @example
     * // Update many Rewards
     * const reward = await prisma.reward.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Rewards and only return the `id`
     * const rewardWithIdOnly = await prisma.reward.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RewardUpdateManyAndReturnArgs>(args: SelectSubset<T, RewardUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Reward.
     * @param {RewardUpsertArgs} args - Arguments to update or create a Reward.
     * @example
     * // Update or create a Reward
     * const reward = await prisma.reward.upsert({
     *   create: {
     *     // ... data to create a Reward
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Reward we want to update
     *   }
     * })
     */
    upsert<T extends RewardUpsertArgs>(args: SelectSubset<T, RewardUpsertArgs<ExtArgs>>): Prisma__RewardClient<$Result.GetResult<Prisma.$RewardPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Rewards.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RewardCountArgs} args - Arguments to filter Rewards to count.
     * @example
     * // Count the number of Rewards
     * const count = await prisma.reward.count({
     *   where: {
     *     // ... the filter for the Rewards we want to count
     *   }
     * })
    **/
    count<T extends RewardCountArgs>(
      args?: Subset<T, RewardCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RewardCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Reward.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RewardAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RewardAggregateArgs>(args: Subset<T, RewardAggregateArgs>): Prisma.PrismaPromise<GetRewardAggregateType<T>>

    /**
     * Group by Reward.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RewardGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RewardGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RewardGroupByArgs['orderBy'] }
        : { orderBy?: RewardGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RewardGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRewardGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Reward model
   */
  readonly fields: RewardFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Reward.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RewardClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sender<T extends MemberDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MemberDefaultArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    recipient<T extends MemberDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MemberDefaultArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Reward model
   */
  interface RewardFieldRefs {
    readonly id: FieldRef<"Reward", 'String'>
    readonly senderId: FieldRef<"Reward", 'String'>
    readonly recipientId: FieldRef<"Reward", 'String'>
    readonly amount: FieldRef<"Reward", 'Float'>
    readonly currency: FieldRef<"Reward", 'String'>
    readonly note: FieldRef<"Reward", 'String'>
    readonly isRecurring: FieldRef<"Reward", 'Boolean'>
    readonly createdAt: FieldRef<"Reward", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Reward findUnique
   */
  export type RewardFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardInclude<ExtArgs> | null
    /**
     * Filter, which Reward to fetch.
     */
    where: RewardWhereUniqueInput
  }

  /**
   * Reward findUniqueOrThrow
   */
  export type RewardFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardInclude<ExtArgs> | null
    /**
     * Filter, which Reward to fetch.
     */
    where: RewardWhereUniqueInput
  }

  /**
   * Reward findFirst
   */
  export type RewardFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardInclude<ExtArgs> | null
    /**
     * Filter, which Reward to fetch.
     */
    where?: RewardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rewards to fetch.
     */
    orderBy?: RewardOrderByWithRelationInput | RewardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Rewards.
     */
    cursor?: RewardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rewards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rewards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Rewards.
     */
    distinct?: RewardScalarFieldEnum | RewardScalarFieldEnum[]
  }

  /**
   * Reward findFirstOrThrow
   */
  export type RewardFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardInclude<ExtArgs> | null
    /**
     * Filter, which Reward to fetch.
     */
    where?: RewardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rewards to fetch.
     */
    orderBy?: RewardOrderByWithRelationInput | RewardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Rewards.
     */
    cursor?: RewardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rewards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rewards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Rewards.
     */
    distinct?: RewardScalarFieldEnum | RewardScalarFieldEnum[]
  }

  /**
   * Reward findMany
   */
  export type RewardFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardInclude<ExtArgs> | null
    /**
     * Filter, which Rewards to fetch.
     */
    where?: RewardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rewards to fetch.
     */
    orderBy?: RewardOrderByWithRelationInput | RewardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Rewards.
     */
    cursor?: RewardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rewards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rewards.
     */
    skip?: number
    distinct?: RewardScalarFieldEnum | RewardScalarFieldEnum[]
  }

  /**
   * Reward create
   */
  export type RewardCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardInclude<ExtArgs> | null
    /**
     * The data needed to create a Reward.
     */
    data: XOR<RewardCreateInput, RewardUncheckedCreateInput>
  }

  /**
   * Reward createMany
   */
  export type RewardCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Rewards.
     */
    data: RewardCreateManyInput | RewardCreateManyInput[]
  }

  /**
   * Reward createManyAndReturn
   */
  export type RewardCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * The data used to create many Rewards.
     */
    data: RewardCreateManyInput | RewardCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Reward update
   */
  export type RewardUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardInclude<ExtArgs> | null
    /**
     * The data needed to update a Reward.
     */
    data: XOR<RewardUpdateInput, RewardUncheckedUpdateInput>
    /**
     * Choose, which Reward to update.
     */
    where: RewardWhereUniqueInput
  }

  /**
   * Reward updateMany
   */
  export type RewardUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Rewards.
     */
    data: XOR<RewardUpdateManyMutationInput, RewardUncheckedUpdateManyInput>
    /**
     * Filter which Rewards to update
     */
    where?: RewardWhereInput
    /**
     * Limit how many Rewards to update.
     */
    limit?: number
  }

  /**
   * Reward updateManyAndReturn
   */
  export type RewardUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * The data used to update Rewards.
     */
    data: XOR<RewardUpdateManyMutationInput, RewardUncheckedUpdateManyInput>
    /**
     * Filter which Rewards to update
     */
    where?: RewardWhereInput
    /**
     * Limit how many Rewards to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Reward upsert
   */
  export type RewardUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardInclude<ExtArgs> | null
    /**
     * The filter to search for the Reward to update in case it exists.
     */
    where: RewardWhereUniqueInput
    /**
     * In case the Reward found by the `where` argument doesn't exist, create a new Reward with this data.
     */
    create: XOR<RewardCreateInput, RewardUncheckedCreateInput>
    /**
     * In case the Reward was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RewardUpdateInput, RewardUncheckedUpdateInput>
  }

  /**
   * Reward delete
   */
  export type RewardDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardInclude<ExtArgs> | null
    /**
     * Filter which Reward to delete.
     */
    where: RewardWhereUniqueInput
  }

  /**
   * Reward deleteMany
   */
  export type RewardDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Rewards to delete
     */
    where?: RewardWhereInput
    /**
     * Limit how many Rewards to delete.
     */
    limit?: number
  }

  /**
   * Reward without action
   */
  export type RewardDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Reward
     */
    select?: RewardSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Reward
     */
    omit?: RewardOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RewardInclude<ExtArgs> | null
  }


  /**
   * Model Evaluation
   */

  export type AggregateEvaluation = {
    _count: EvaluationCountAggregateOutputType | null
    _min: EvaluationMinAggregateOutputType | null
    _max: EvaluationMaxAggregateOutputType | null
  }

  export type EvaluationMinAggregateOutputType = {
    id: string | null
    curatorId: string | null
    subject: string | null
    note: string | null
    createdAt: Date | null
  }

  export type EvaluationMaxAggregateOutputType = {
    id: string | null
    curatorId: string | null
    subject: string | null
    note: string | null
    createdAt: Date | null
  }

  export type EvaluationCountAggregateOutputType = {
    id: number
    curatorId: number
    subject: number
    note: number
    createdAt: number
    _all: number
  }


  export type EvaluationMinAggregateInputType = {
    id?: true
    curatorId?: true
    subject?: true
    note?: true
    createdAt?: true
  }

  export type EvaluationMaxAggregateInputType = {
    id?: true
    curatorId?: true
    subject?: true
    note?: true
    createdAt?: true
  }

  export type EvaluationCountAggregateInputType = {
    id?: true
    curatorId?: true
    subject?: true
    note?: true
    createdAt?: true
    _all?: true
  }

  export type EvaluationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Evaluation to aggregate.
     */
    where?: EvaluationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Evaluations to fetch.
     */
    orderBy?: EvaluationOrderByWithRelationInput | EvaluationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EvaluationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Evaluations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Evaluations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Evaluations
    **/
    _count?: true | EvaluationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EvaluationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EvaluationMaxAggregateInputType
  }

  export type GetEvaluationAggregateType<T extends EvaluationAggregateArgs> = {
        [P in keyof T & keyof AggregateEvaluation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEvaluation[P]>
      : GetScalarType<T[P], AggregateEvaluation[P]>
  }




  export type EvaluationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EvaluationWhereInput
    orderBy?: EvaluationOrderByWithAggregationInput | EvaluationOrderByWithAggregationInput[]
    by: EvaluationScalarFieldEnum[] | EvaluationScalarFieldEnum
    having?: EvaluationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EvaluationCountAggregateInputType | true
    _min?: EvaluationMinAggregateInputType
    _max?: EvaluationMaxAggregateInputType
  }

  export type EvaluationGroupByOutputType = {
    id: string
    curatorId: string
    subject: string
    note: string | null
    createdAt: Date
    _count: EvaluationCountAggregateOutputType | null
    _min: EvaluationMinAggregateOutputType | null
    _max: EvaluationMaxAggregateOutputType | null
  }

  type GetEvaluationGroupByPayload<T extends EvaluationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EvaluationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EvaluationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EvaluationGroupByOutputType[P]>
            : GetScalarType<T[P], EvaluationGroupByOutputType[P]>
        }
      >
    >


  export type EvaluationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    curatorId?: boolean
    subject?: boolean
    note?: boolean
    createdAt?: boolean
    curator?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["evaluation"]>

  export type EvaluationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    curatorId?: boolean
    subject?: boolean
    note?: boolean
    createdAt?: boolean
    curator?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["evaluation"]>

  export type EvaluationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    curatorId?: boolean
    subject?: boolean
    note?: boolean
    createdAt?: boolean
    curator?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["evaluation"]>

  export type EvaluationSelectScalar = {
    id?: boolean
    curatorId?: boolean
    subject?: boolean
    note?: boolean
    createdAt?: boolean
  }

  export type EvaluationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "curatorId" | "subject" | "note" | "createdAt", ExtArgs["result"]["evaluation"]>
  export type EvaluationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    curator?: boolean | MemberDefaultArgs<ExtArgs>
  }
  export type EvaluationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    curator?: boolean | MemberDefaultArgs<ExtArgs>
  }
  export type EvaluationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    curator?: boolean | MemberDefaultArgs<ExtArgs>
  }

  export type $EvaluationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Evaluation"
    objects: {
      curator: Prisma.$MemberPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      curatorId: string
      subject: string
      note: string | null
      createdAt: Date
    }, ExtArgs["result"]["evaluation"]>
    composites: {}
  }

  type EvaluationGetPayload<S extends boolean | null | undefined | EvaluationDefaultArgs> = $Result.GetResult<Prisma.$EvaluationPayload, S>

  type EvaluationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EvaluationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EvaluationCountAggregateInputType | true
    }

  export interface EvaluationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Evaluation'], meta: { name: 'Evaluation' } }
    /**
     * Find zero or one Evaluation that matches the filter.
     * @param {EvaluationFindUniqueArgs} args - Arguments to find a Evaluation
     * @example
     * // Get one Evaluation
     * const evaluation = await prisma.evaluation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EvaluationFindUniqueArgs>(args: SelectSubset<T, EvaluationFindUniqueArgs<ExtArgs>>): Prisma__EvaluationClient<$Result.GetResult<Prisma.$EvaluationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Evaluation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EvaluationFindUniqueOrThrowArgs} args - Arguments to find a Evaluation
     * @example
     * // Get one Evaluation
     * const evaluation = await prisma.evaluation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EvaluationFindUniqueOrThrowArgs>(args: SelectSubset<T, EvaluationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EvaluationClient<$Result.GetResult<Prisma.$EvaluationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Evaluation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EvaluationFindFirstArgs} args - Arguments to find a Evaluation
     * @example
     * // Get one Evaluation
     * const evaluation = await prisma.evaluation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EvaluationFindFirstArgs>(args?: SelectSubset<T, EvaluationFindFirstArgs<ExtArgs>>): Prisma__EvaluationClient<$Result.GetResult<Prisma.$EvaluationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Evaluation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EvaluationFindFirstOrThrowArgs} args - Arguments to find a Evaluation
     * @example
     * // Get one Evaluation
     * const evaluation = await prisma.evaluation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EvaluationFindFirstOrThrowArgs>(args?: SelectSubset<T, EvaluationFindFirstOrThrowArgs<ExtArgs>>): Prisma__EvaluationClient<$Result.GetResult<Prisma.$EvaluationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Evaluations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EvaluationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Evaluations
     * const evaluations = await prisma.evaluation.findMany()
     * 
     * // Get first 10 Evaluations
     * const evaluations = await prisma.evaluation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const evaluationWithIdOnly = await prisma.evaluation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EvaluationFindManyArgs>(args?: SelectSubset<T, EvaluationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EvaluationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Evaluation.
     * @param {EvaluationCreateArgs} args - Arguments to create a Evaluation.
     * @example
     * // Create one Evaluation
     * const Evaluation = await prisma.evaluation.create({
     *   data: {
     *     // ... data to create a Evaluation
     *   }
     * })
     * 
     */
    create<T extends EvaluationCreateArgs>(args: SelectSubset<T, EvaluationCreateArgs<ExtArgs>>): Prisma__EvaluationClient<$Result.GetResult<Prisma.$EvaluationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Evaluations.
     * @param {EvaluationCreateManyArgs} args - Arguments to create many Evaluations.
     * @example
     * // Create many Evaluations
     * const evaluation = await prisma.evaluation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EvaluationCreateManyArgs>(args?: SelectSubset<T, EvaluationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Evaluations and returns the data saved in the database.
     * @param {EvaluationCreateManyAndReturnArgs} args - Arguments to create many Evaluations.
     * @example
     * // Create many Evaluations
     * const evaluation = await prisma.evaluation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Evaluations and only return the `id`
     * const evaluationWithIdOnly = await prisma.evaluation.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EvaluationCreateManyAndReturnArgs>(args?: SelectSubset<T, EvaluationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EvaluationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Evaluation.
     * @param {EvaluationDeleteArgs} args - Arguments to delete one Evaluation.
     * @example
     * // Delete one Evaluation
     * const Evaluation = await prisma.evaluation.delete({
     *   where: {
     *     // ... filter to delete one Evaluation
     *   }
     * })
     * 
     */
    delete<T extends EvaluationDeleteArgs>(args: SelectSubset<T, EvaluationDeleteArgs<ExtArgs>>): Prisma__EvaluationClient<$Result.GetResult<Prisma.$EvaluationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Evaluation.
     * @param {EvaluationUpdateArgs} args - Arguments to update one Evaluation.
     * @example
     * // Update one Evaluation
     * const evaluation = await prisma.evaluation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EvaluationUpdateArgs>(args: SelectSubset<T, EvaluationUpdateArgs<ExtArgs>>): Prisma__EvaluationClient<$Result.GetResult<Prisma.$EvaluationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Evaluations.
     * @param {EvaluationDeleteManyArgs} args - Arguments to filter Evaluations to delete.
     * @example
     * // Delete a few Evaluations
     * const { count } = await prisma.evaluation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EvaluationDeleteManyArgs>(args?: SelectSubset<T, EvaluationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Evaluations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EvaluationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Evaluations
     * const evaluation = await prisma.evaluation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EvaluationUpdateManyArgs>(args: SelectSubset<T, EvaluationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Evaluations and returns the data updated in the database.
     * @param {EvaluationUpdateManyAndReturnArgs} args - Arguments to update many Evaluations.
     * @example
     * // Update many Evaluations
     * const evaluation = await prisma.evaluation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Evaluations and only return the `id`
     * const evaluationWithIdOnly = await prisma.evaluation.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EvaluationUpdateManyAndReturnArgs>(args: SelectSubset<T, EvaluationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EvaluationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Evaluation.
     * @param {EvaluationUpsertArgs} args - Arguments to update or create a Evaluation.
     * @example
     * // Update or create a Evaluation
     * const evaluation = await prisma.evaluation.upsert({
     *   create: {
     *     // ... data to create a Evaluation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Evaluation we want to update
     *   }
     * })
     */
    upsert<T extends EvaluationUpsertArgs>(args: SelectSubset<T, EvaluationUpsertArgs<ExtArgs>>): Prisma__EvaluationClient<$Result.GetResult<Prisma.$EvaluationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Evaluations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EvaluationCountArgs} args - Arguments to filter Evaluations to count.
     * @example
     * // Count the number of Evaluations
     * const count = await prisma.evaluation.count({
     *   where: {
     *     // ... the filter for the Evaluations we want to count
     *   }
     * })
    **/
    count<T extends EvaluationCountArgs>(
      args?: Subset<T, EvaluationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EvaluationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Evaluation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EvaluationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EvaluationAggregateArgs>(args: Subset<T, EvaluationAggregateArgs>): Prisma.PrismaPromise<GetEvaluationAggregateType<T>>

    /**
     * Group by Evaluation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EvaluationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EvaluationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EvaluationGroupByArgs['orderBy'] }
        : { orderBy?: EvaluationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EvaluationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEvaluationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Evaluation model
   */
  readonly fields: EvaluationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Evaluation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EvaluationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    curator<T extends MemberDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MemberDefaultArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Evaluation model
   */
  interface EvaluationFieldRefs {
    readonly id: FieldRef<"Evaluation", 'String'>
    readonly curatorId: FieldRef<"Evaluation", 'String'>
    readonly subject: FieldRef<"Evaluation", 'String'>
    readonly note: FieldRef<"Evaluation", 'String'>
    readonly createdAt: FieldRef<"Evaluation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Evaluation findUnique
   */
  export type EvaluationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationInclude<ExtArgs> | null
    /**
     * Filter, which Evaluation to fetch.
     */
    where: EvaluationWhereUniqueInput
  }

  /**
   * Evaluation findUniqueOrThrow
   */
  export type EvaluationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationInclude<ExtArgs> | null
    /**
     * Filter, which Evaluation to fetch.
     */
    where: EvaluationWhereUniqueInput
  }

  /**
   * Evaluation findFirst
   */
  export type EvaluationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationInclude<ExtArgs> | null
    /**
     * Filter, which Evaluation to fetch.
     */
    where?: EvaluationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Evaluations to fetch.
     */
    orderBy?: EvaluationOrderByWithRelationInput | EvaluationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Evaluations.
     */
    cursor?: EvaluationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Evaluations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Evaluations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Evaluations.
     */
    distinct?: EvaluationScalarFieldEnum | EvaluationScalarFieldEnum[]
  }

  /**
   * Evaluation findFirstOrThrow
   */
  export type EvaluationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationInclude<ExtArgs> | null
    /**
     * Filter, which Evaluation to fetch.
     */
    where?: EvaluationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Evaluations to fetch.
     */
    orderBy?: EvaluationOrderByWithRelationInput | EvaluationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Evaluations.
     */
    cursor?: EvaluationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Evaluations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Evaluations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Evaluations.
     */
    distinct?: EvaluationScalarFieldEnum | EvaluationScalarFieldEnum[]
  }

  /**
   * Evaluation findMany
   */
  export type EvaluationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationInclude<ExtArgs> | null
    /**
     * Filter, which Evaluations to fetch.
     */
    where?: EvaluationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Evaluations to fetch.
     */
    orderBy?: EvaluationOrderByWithRelationInput | EvaluationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Evaluations.
     */
    cursor?: EvaluationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Evaluations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Evaluations.
     */
    skip?: number
    distinct?: EvaluationScalarFieldEnum | EvaluationScalarFieldEnum[]
  }

  /**
   * Evaluation create
   */
  export type EvaluationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationInclude<ExtArgs> | null
    /**
     * The data needed to create a Evaluation.
     */
    data: XOR<EvaluationCreateInput, EvaluationUncheckedCreateInput>
  }

  /**
   * Evaluation createMany
   */
  export type EvaluationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Evaluations.
     */
    data: EvaluationCreateManyInput | EvaluationCreateManyInput[]
  }

  /**
   * Evaluation createManyAndReturn
   */
  export type EvaluationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * The data used to create many Evaluations.
     */
    data: EvaluationCreateManyInput | EvaluationCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Evaluation update
   */
  export type EvaluationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationInclude<ExtArgs> | null
    /**
     * The data needed to update a Evaluation.
     */
    data: XOR<EvaluationUpdateInput, EvaluationUncheckedUpdateInput>
    /**
     * Choose, which Evaluation to update.
     */
    where: EvaluationWhereUniqueInput
  }

  /**
   * Evaluation updateMany
   */
  export type EvaluationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Evaluations.
     */
    data: XOR<EvaluationUpdateManyMutationInput, EvaluationUncheckedUpdateManyInput>
    /**
     * Filter which Evaluations to update
     */
    where?: EvaluationWhereInput
    /**
     * Limit how many Evaluations to update.
     */
    limit?: number
  }

  /**
   * Evaluation updateManyAndReturn
   */
  export type EvaluationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * The data used to update Evaluations.
     */
    data: XOR<EvaluationUpdateManyMutationInput, EvaluationUncheckedUpdateManyInput>
    /**
     * Filter which Evaluations to update
     */
    where?: EvaluationWhereInput
    /**
     * Limit how many Evaluations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Evaluation upsert
   */
  export type EvaluationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationInclude<ExtArgs> | null
    /**
     * The filter to search for the Evaluation to update in case it exists.
     */
    where: EvaluationWhereUniqueInput
    /**
     * In case the Evaluation found by the `where` argument doesn't exist, create a new Evaluation with this data.
     */
    create: XOR<EvaluationCreateInput, EvaluationUncheckedCreateInput>
    /**
     * In case the Evaluation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EvaluationUpdateInput, EvaluationUncheckedUpdateInput>
  }

  /**
   * Evaluation delete
   */
  export type EvaluationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationInclude<ExtArgs> | null
    /**
     * Filter which Evaluation to delete.
     */
    where: EvaluationWhereUniqueInput
  }

  /**
   * Evaluation deleteMany
   */
  export type EvaluationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Evaluations to delete
     */
    where?: EvaluationWhereInput
    /**
     * Limit how many Evaluations to delete.
     */
    limit?: number
  }

  /**
   * Evaluation without action
   */
  export type EvaluationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Evaluation
     */
    select?: EvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Evaluation
     */
    omit?: EvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EvaluationInclude<ExtArgs> | null
  }


  /**
   * Model RelationshipStrength
   */

  export type AggregateRelationshipStrength = {
    _count: RelationshipStrengthCountAggregateOutputType | null
    _avg: RelationshipStrengthAvgAggregateOutputType | null
    _sum: RelationshipStrengthSumAggregateOutputType | null
    _min: RelationshipStrengthMinAggregateOutputType | null
    _max: RelationshipStrengthMaxAggregateOutputType | null
  }

  export type RelationshipStrengthAvgAggregateOutputType = {
    strength: number | null
  }

  export type RelationshipStrengthSumAggregateOutputType = {
    strength: number | null
  }

  export type RelationshipStrengthMinAggregateOutputType = {
    id: string | null
    memberAId: string | null
    memberBId: string | null
    strength: number | null
  }

  export type RelationshipStrengthMaxAggregateOutputType = {
    id: string | null
    memberAId: string | null
    memberBId: string | null
    strength: number | null
  }

  export type RelationshipStrengthCountAggregateOutputType = {
    id: number
    memberAId: number
    memberBId: number
    strength: number
    _all: number
  }


  export type RelationshipStrengthAvgAggregateInputType = {
    strength?: true
  }

  export type RelationshipStrengthSumAggregateInputType = {
    strength?: true
  }

  export type RelationshipStrengthMinAggregateInputType = {
    id?: true
    memberAId?: true
    memberBId?: true
    strength?: true
  }

  export type RelationshipStrengthMaxAggregateInputType = {
    id?: true
    memberAId?: true
    memberBId?: true
    strength?: true
  }

  export type RelationshipStrengthCountAggregateInputType = {
    id?: true
    memberAId?: true
    memberBId?: true
    strength?: true
    _all?: true
  }

  export type RelationshipStrengthAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RelationshipStrength to aggregate.
     */
    where?: RelationshipStrengthWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RelationshipStrengths to fetch.
     */
    orderBy?: RelationshipStrengthOrderByWithRelationInput | RelationshipStrengthOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RelationshipStrengthWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RelationshipStrengths from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RelationshipStrengths.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned RelationshipStrengths
    **/
    _count?: true | RelationshipStrengthCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RelationshipStrengthAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RelationshipStrengthSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RelationshipStrengthMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RelationshipStrengthMaxAggregateInputType
  }

  export type GetRelationshipStrengthAggregateType<T extends RelationshipStrengthAggregateArgs> = {
        [P in keyof T & keyof AggregateRelationshipStrength]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRelationshipStrength[P]>
      : GetScalarType<T[P], AggregateRelationshipStrength[P]>
  }




  export type RelationshipStrengthGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RelationshipStrengthWhereInput
    orderBy?: RelationshipStrengthOrderByWithAggregationInput | RelationshipStrengthOrderByWithAggregationInput[]
    by: RelationshipStrengthScalarFieldEnum[] | RelationshipStrengthScalarFieldEnum
    having?: RelationshipStrengthScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RelationshipStrengthCountAggregateInputType | true
    _avg?: RelationshipStrengthAvgAggregateInputType
    _sum?: RelationshipStrengthSumAggregateInputType
    _min?: RelationshipStrengthMinAggregateInputType
    _max?: RelationshipStrengthMaxAggregateInputType
  }

  export type RelationshipStrengthGroupByOutputType = {
    id: string
    memberAId: string
    memberBId: string
    strength: number
    _count: RelationshipStrengthCountAggregateOutputType | null
    _avg: RelationshipStrengthAvgAggregateOutputType | null
    _sum: RelationshipStrengthSumAggregateOutputType | null
    _min: RelationshipStrengthMinAggregateOutputType | null
    _max: RelationshipStrengthMaxAggregateOutputType | null
  }

  type GetRelationshipStrengthGroupByPayload<T extends RelationshipStrengthGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RelationshipStrengthGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RelationshipStrengthGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RelationshipStrengthGroupByOutputType[P]>
            : GetScalarType<T[P], RelationshipStrengthGroupByOutputType[P]>
        }
      >
    >


  export type RelationshipStrengthSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    memberAId?: boolean
    memberBId?: boolean
    strength?: boolean
    memberA?: boolean | MemberDefaultArgs<ExtArgs>
    memberB?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["relationshipStrength"]>

  export type RelationshipStrengthSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    memberAId?: boolean
    memberBId?: boolean
    strength?: boolean
    memberA?: boolean | MemberDefaultArgs<ExtArgs>
    memberB?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["relationshipStrength"]>

  export type RelationshipStrengthSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    memberAId?: boolean
    memberBId?: boolean
    strength?: boolean
    memberA?: boolean | MemberDefaultArgs<ExtArgs>
    memberB?: boolean | MemberDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["relationshipStrength"]>

  export type RelationshipStrengthSelectScalar = {
    id?: boolean
    memberAId?: boolean
    memberBId?: boolean
    strength?: boolean
  }

  export type RelationshipStrengthOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "memberAId" | "memberBId" | "strength", ExtArgs["result"]["relationshipStrength"]>
  export type RelationshipStrengthInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    memberA?: boolean | MemberDefaultArgs<ExtArgs>
    memberB?: boolean | MemberDefaultArgs<ExtArgs>
  }
  export type RelationshipStrengthIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    memberA?: boolean | MemberDefaultArgs<ExtArgs>
    memberB?: boolean | MemberDefaultArgs<ExtArgs>
  }
  export type RelationshipStrengthIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    memberA?: boolean | MemberDefaultArgs<ExtArgs>
    memberB?: boolean | MemberDefaultArgs<ExtArgs>
  }

  export type $RelationshipStrengthPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "RelationshipStrength"
    objects: {
      memberA: Prisma.$MemberPayload<ExtArgs>
      memberB: Prisma.$MemberPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      memberAId: string
      memberBId: string
      strength: number
    }, ExtArgs["result"]["relationshipStrength"]>
    composites: {}
  }

  type RelationshipStrengthGetPayload<S extends boolean | null | undefined | RelationshipStrengthDefaultArgs> = $Result.GetResult<Prisma.$RelationshipStrengthPayload, S>

  type RelationshipStrengthCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RelationshipStrengthFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RelationshipStrengthCountAggregateInputType | true
    }

  export interface RelationshipStrengthDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RelationshipStrength'], meta: { name: 'RelationshipStrength' } }
    /**
     * Find zero or one RelationshipStrength that matches the filter.
     * @param {RelationshipStrengthFindUniqueArgs} args - Arguments to find a RelationshipStrength
     * @example
     * // Get one RelationshipStrength
     * const relationshipStrength = await prisma.relationshipStrength.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RelationshipStrengthFindUniqueArgs>(args: SelectSubset<T, RelationshipStrengthFindUniqueArgs<ExtArgs>>): Prisma__RelationshipStrengthClient<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one RelationshipStrength that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RelationshipStrengthFindUniqueOrThrowArgs} args - Arguments to find a RelationshipStrength
     * @example
     * // Get one RelationshipStrength
     * const relationshipStrength = await prisma.relationshipStrength.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RelationshipStrengthFindUniqueOrThrowArgs>(args: SelectSubset<T, RelationshipStrengthFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RelationshipStrengthClient<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RelationshipStrength that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipStrengthFindFirstArgs} args - Arguments to find a RelationshipStrength
     * @example
     * // Get one RelationshipStrength
     * const relationshipStrength = await prisma.relationshipStrength.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RelationshipStrengthFindFirstArgs>(args?: SelectSubset<T, RelationshipStrengthFindFirstArgs<ExtArgs>>): Prisma__RelationshipStrengthClient<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RelationshipStrength that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipStrengthFindFirstOrThrowArgs} args - Arguments to find a RelationshipStrength
     * @example
     * // Get one RelationshipStrength
     * const relationshipStrength = await prisma.relationshipStrength.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RelationshipStrengthFindFirstOrThrowArgs>(args?: SelectSubset<T, RelationshipStrengthFindFirstOrThrowArgs<ExtArgs>>): Prisma__RelationshipStrengthClient<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more RelationshipStrengths that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipStrengthFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RelationshipStrengths
     * const relationshipStrengths = await prisma.relationshipStrength.findMany()
     * 
     * // Get first 10 RelationshipStrengths
     * const relationshipStrengths = await prisma.relationshipStrength.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const relationshipStrengthWithIdOnly = await prisma.relationshipStrength.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RelationshipStrengthFindManyArgs>(args?: SelectSubset<T, RelationshipStrengthFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a RelationshipStrength.
     * @param {RelationshipStrengthCreateArgs} args - Arguments to create a RelationshipStrength.
     * @example
     * // Create one RelationshipStrength
     * const RelationshipStrength = await prisma.relationshipStrength.create({
     *   data: {
     *     // ... data to create a RelationshipStrength
     *   }
     * })
     * 
     */
    create<T extends RelationshipStrengthCreateArgs>(args: SelectSubset<T, RelationshipStrengthCreateArgs<ExtArgs>>): Prisma__RelationshipStrengthClient<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many RelationshipStrengths.
     * @param {RelationshipStrengthCreateManyArgs} args - Arguments to create many RelationshipStrengths.
     * @example
     * // Create many RelationshipStrengths
     * const relationshipStrength = await prisma.relationshipStrength.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RelationshipStrengthCreateManyArgs>(args?: SelectSubset<T, RelationshipStrengthCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many RelationshipStrengths and returns the data saved in the database.
     * @param {RelationshipStrengthCreateManyAndReturnArgs} args - Arguments to create many RelationshipStrengths.
     * @example
     * // Create many RelationshipStrengths
     * const relationshipStrength = await prisma.relationshipStrength.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many RelationshipStrengths and only return the `id`
     * const relationshipStrengthWithIdOnly = await prisma.relationshipStrength.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RelationshipStrengthCreateManyAndReturnArgs>(args?: SelectSubset<T, RelationshipStrengthCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a RelationshipStrength.
     * @param {RelationshipStrengthDeleteArgs} args - Arguments to delete one RelationshipStrength.
     * @example
     * // Delete one RelationshipStrength
     * const RelationshipStrength = await prisma.relationshipStrength.delete({
     *   where: {
     *     // ... filter to delete one RelationshipStrength
     *   }
     * })
     * 
     */
    delete<T extends RelationshipStrengthDeleteArgs>(args: SelectSubset<T, RelationshipStrengthDeleteArgs<ExtArgs>>): Prisma__RelationshipStrengthClient<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one RelationshipStrength.
     * @param {RelationshipStrengthUpdateArgs} args - Arguments to update one RelationshipStrength.
     * @example
     * // Update one RelationshipStrength
     * const relationshipStrength = await prisma.relationshipStrength.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RelationshipStrengthUpdateArgs>(args: SelectSubset<T, RelationshipStrengthUpdateArgs<ExtArgs>>): Prisma__RelationshipStrengthClient<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more RelationshipStrengths.
     * @param {RelationshipStrengthDeleteManyArgs} args - Arguments to filter RelationshipStrengths to delete.
     * @example
     * // Delete a few RelationshipStrengths
     * const { count } = await prisma.relationshipStrength.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RelationshipStrengthDeleteManyArgs>(args?: SelectSubset<T, RelationshipStrengthDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RelationshipStrengths.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipStrengthUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RelationshipStrengths
     * const relationshipStrength = await prisma.relationshipStrength.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RelationshipStrengthUpdateManyArgs>(args: SelectSubset<T, RelationshipStrengthUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RelationshipStrengths and returns the data updated in the database.
     * @param {RelationshipStrengthUpdateManyAndReturnArgs} args - Arguments to update many RelationshipStrengths.
     * @example
     * // Update many RelationshipStrengths
     * const relationshipStrength = await prisma.relationshipStrength.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more RelationshipStrengths and only return the `id`
     * const relationshipStrengthWithIdOnly = await prisma.relationshipStrength.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RelationshipStrengthUpdateManyAndReturnArgs>(args: SelectSubset<T, RelationshipStrengthUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one RelationshipStrength.
     * @param {RelationshipStrengthUpsertArgs} args - Arguments to update or create a RelationshipStrength.
     * @example
     * // Update or create a RelationshipStrength
     * const relationshipStrength = await prisma.relationshipStrength.upsert({
     *   create: {
     *     // ... data to create a RelationshipStrength
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RelationshipStrength we want to update
     *   }
     * })
     */
    upsert<T extends RelationshipStrengthUpsertArgs>(args: SelectSubset<T, RelationshipStrengthUpsertArgs<ExtArgs>>): Prisma__RelationshipStrengthClient<$Result.GetResult<Prisma.$RelationshipStrengthPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of RelationshipStrengths.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipStrengthCountArgs} args - Arguments to filter RelationshipStrengths to count.
     * @example
     * // Count the number of RelationshipStrengths
     * const count = await prisma.relationshipStrength.count({
     *   where: {
     *     // ... the filter for the RelationshipStrengths we want to count
     *   }
     * })
    **/
    count<T extends RelationshipStrengthCountArgs>(
      args?: Subset<T, RelationshipStrengthCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RelationshipStrengthCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RelationshipStrength.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipStrengthAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RelationshipStrengthAggregateArgs>(args: Subset<T, RelationshipStrengthAggregateArgs>): Prisma.PrismaPromise<GetRelationshipStrengthAggregateType<T>>

    /**
     * Group by RelationshipStrength.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RelationshipStrengthGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RelationshipStrengthGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RelationshipStrengthGroupByArgs['orderBy'] }
        : { orderBy?: RelationshipStrengthGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RelationshipStrengthGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRelationshipStrengthGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the RelationshipStrength model
   */
  readonly fields: RelationshipStrengthFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for RelationshipStrength.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RelationshipStrengthClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    memberA<T extends MemberDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MemberDefaultArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    memberB<T extends MemberDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MemberDefaultArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the RelationshipStrength model
   */
  interface RelationshipStrengthFieldRefs {
    readonly id: FieldRef<"RelationshipStrength", 'String'>
    readonly memberAId: FieldRef<"RelationshipStrength", 'String'>
    readonly memberBId: FieldRef<"RelationshipStrength", 'String'>
    readonly strength: FieldRef<"RelationshipStrength", 'Float'>
  }
    

  // Custom InputTypes
  /**
   * RelationshipStrength findUnique
   */
  export type RelationshipStrengthFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthInclude<ExtArgs> | null
    /**
     * Filter, which RelationshipStrength to fetch.
     */
    where: RelationshipStrengthWhereUniqueInput
  }

  /**
   * RelationshipStrength findUniqueOrThrow
   */
  export type RelationshipStrengthFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthInclude<ExtArgs> | null
    /**
     * Filter, which RelationshipStrength to fetch.
     */
    where: RelationshipStrengthWhereUniqueInput
  }

  /**
   * RelationshipStrength findFirst
   */
  export type RelationshipStrengthFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthInclude<ExtArgs> | null
    /**
     * Filter, which RelationshipStrength to fetch.
     */
    where?: RelationshipStrengthWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RelationshipStrengths to fetch.
     */
    orderBy?: RelationshipStrengthOrderByWithRelationInput | RelationshipStrengthOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RelationshipStrengths.
     */
    cursor?: RelationshipStrengthWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RelationshipStrengths from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RelationshipStrengths.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RelationshipStrengths.
     */
    distinct?: RelationshipStrengthScalarFieldEnum | RelationshipStrengthScalarFieldEnum[]
  }

  /**
   * RelationshipStrength findFirstOrThrow
   */
  export type RelationshipStrengthFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthInclude<ExtArgs> | null
    /**
     * Filter, which RelationshipStrength to fetch.
     */
    where?: RelationshipStrengthWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RelationshipStrengths to fetch.
     */
    orderBy?: RelationshipStrengthOrderByWithRelationInput | RelationshipStrengthOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RelationshipStrengths.
     */
    cursor?: RelationshipStrengthWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RelationshipStrengths from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RelationshipStrengths.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RelationshipStrengths.
     */
    distinct?: RelationshipStrengthScalarFieldEnum | RelationshipStrengthScalarFieldEnum[]
  }

  /**
   * RelationshipStrength findMany
   */
  export type RelationshipStrengthFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthInclude<ExtArgs> | null
    /**
     * Filter, which RelationshipStrengths to fetch.
     */
    where?: RelationshipStrengthWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RelationshipStrengths to fetch.
     */
    orderBy?: RelationshipStrengthOrderByWithRelationInput | RelationshipStrengthOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing RelationshipStrengths.
     */
    cursor?: RelationshipStrengthWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RelationshipStrengths from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RelationshipStrengths.
     */
    skip?: number
    distinct?: RelationshipStrengthScalarFieldEnum | RelationshipStrengthScalarFieldEnum[]
  }

  /**
   * RelationshipStrength create
   */
  export type RelationshipStrengthCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthInclude<ExtArgs> | null
    /**
     * The data needed to create a RelationshipStrength.
     */
    data: XOR<RelationshipStrengthCreateInput, RelationshipStrengthUncheckedCreateInput>
  }

  /**
   * RelationshipStrength createMany
   */
  export type RelationshipStrengthCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RelationshipStrengths.
     */
    data: RelationshipStrengthCreateManyInput | RelationshipStrengthCreateManyInput[]
  }

  /**
   * RelationshipStrength createManyAndReturn
   */
  export type RelationshipStrengthCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * The data used to create many RelationshipStrengths.
     */
    data: RelationshipStrengthCreateManyInput | RelationshipStrengthCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * RelationshipStrength update
   */
  export type RelationshipStrengthUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthInclude<ExtArgs> | null
    /**
     * The data needed to update a RelationshipStrength.
     */
    data: XOR<RelationshipStrengthUpdateInput, RelationshipStrengthUncheckedUpdateInput>
    /**
     * Choose, which RelationshipStrength to update.
     */
    where: RelationshipStrengthWhereUniqueInput
  }

  /**
   * RelationshipStrength updateMany
   */
  export type RelationshipStrengthUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RelationshipStrengths.
     */
    data: XOR<RelationshipStrengthUpdateManyMutationInput, RelationshipStrengthUncheckedUpdateManyInput>
    /**
     * Filter which RelationshipStrengths to update
     */
    where?: RelationshipStrengthWhereInput
    /**
     * Limit how many RelationshipStrengths to update.
     */
    limit?: number
  }

  /**
   * RelationshipStrength updateManyAndReturn
   */
  export type RelationshipStrengthUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * The data used to update RelationshipStrengths.
     */
    data: XOR<RelationshipStrengthUpdateManyMutationInput, RelationshipStrengthUncheckedUpdateManyInput>
    /**
     * Filter which RelationshipStrengths to update
     */
    where?: RelationshipStrengthWhereInput
    /**
     * Limit how many RelationshipStrengths to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * RelationshipStrength upsert
   */
  export type RelationshipStrengthUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthInclude<ExtArgs> | null
    /**
     * The filter to search for the RelationshipStrength to update in case it exists.
     */
    where: RelationshipStrengthWhereUniqueInput
    /**
     * In case the RelationshipStrength found by the `where` argument doesn't exist, create a new RelationshipStrength with this data.
     */
    create: XOR<RelationshipStrengthCreateInput, RelationshipStrengthUncheckedCreateInput>
    /**
     * In case the RelationshipStrength was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RelationshipStrengthUpdateInput, RelationshipStrengthUncheckedUpdateInput>
  }

  /**
   * RelationshipStrength delete
   */
  export type RelationshipStrengthDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthInclude<ExtArgs> | null
    /**
     * Filter which RelationshipStrength to delete.
     */
    where: RelationshipStrengthWhereUniqueInput
  }

  /**
   * RelationshipStrength deleteMany
   */
  export type RelationshipStrengthDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RelationshipStrengths to delete
     */
    where?: RelationshipStrengthWhereInput
    /**
     * Limit how many RelationshipStrengths to delete.
     */
    limit?: number
  }

  /**
   * RelationshipStrength without action
   */
  export type RelationshipStrengthDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RelationshipStrength
     */
    select?: RelationshipStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RelationshipStrength
     */
    omit?: RelationshipStrengthOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RelationshipStrengthInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const MemberScalarFieldEnum: {
    id: 'id',
    name: 'name',
    passwordHash: 'passwordHash',
    createdAt: 'createdAt'
  };

  export type MemberScalarFieldEnum = (typeof MemberScalarFieldEnum)[keyof typeof MemberScalarFieldEnum]


  export const MemberRoleScalarFieldEnum: {
    id: 'id',
    memberId: 'memberId',
    role: 'role'
  };

  export type MemberRoleScalarFieldEnum = (typeof MemberRoleScalarFieldEnum)[keyof typeof MemberRoleScalarFieldEnum]


  export const WalletScalarFieldEnum: {
    id: 'id',
    memberId: 'memberId',
    currency: 'currency',
    balance: 'balance'
  };

  export type WalletScalarFieldEnum = (typeof WalletScalarFieldEnum)[keyof typeof WalletScalarFieldEnum]


  export const TransactionScalarFieldEnum: {
    id: 'id',
    senderId: 'senderId',
    recipientId: 'recipientId',
    amount: 'amount',
    currency: 'currency',
    note: 'note',
    isPrivate: 'isPrivate',
    createdAt: 'createdAt'
  };

  export type TransactionScalarFieldEnum = (typeof TransactionScalarFieldEnum)[keyof typeof TransactionScalarFieldEnum]


  export const RewardScalarFieldEnum: {
    id: 'id',
    senderId: 'senderId',
    recipientId: 'recipientId',
    amount: 'amount',
    currency: 'currency',
    note: 'note',
    isRecurring: 'isRecurring',
    createdAt: 'createdAt'
  };

  export type RewardScalarFieldEnum = (typeof RewardScalarFieldEnum)[keyof typeof RewardScalarFieldEnum]


  export const EvaluationScalarFieldEnum: {
    id: 'id',
    curatorId: 'curatorId',
    subject: 'subject',
    note: 'note',
    createdAt: 'createdAt'
  };

  export type EvaluationScalarFieldEnum = (typeof EvaluationScalarFieldEnum)[keyof typeof EvaluationScalarFieldEnum]


  export const RelationshipStrengthScalarFieldEnum: {
    id: 'id',
    memberAId: 'memberAId',
    memberBId: 'memberBId',
    strength: 'strength'
  };

  export type RelationshipStrengthScalarFieldEnum = (typeof RelationshipStrengthScalarFieldEnum)[keyof typeof RelationshipStrengthScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    
  /**
   * Deep Input Types
   */


  export type MemberWhereInput = {
    AND?: MemberWhereInput | MemberWhereInput[]
    OR?: MemberWhereInput[]
    NOT?: MemberWhereInput | MemberWhereInput[]
    id?: StringFilter<"Member"> | string
    name?: StringFilter<"Member"> | string
    passwordHash?: StringNullableFilter<"Member"> | string | null
    createdAt?: DateTimeFilter<"Member"> | Date | string
    roles?: MemberRoleListRelationFilter
    wallet?: XOR<WalletNullableScalarRelationFilter, WalletWhereInput> | null
    transactionsSent?: TransactionListRelationFilter
    transactionsReceived?: TransactionListRelationFilter
    rewardsSent?: RewardListRelationFilter
    rewardsReceived?: RewardListRelationFilter
    evaluationsGiven?: EvaluationListRelationFilter
    relationshipsFrom?: RelationshipStrengthListRelationFilter
    relationshipsTo?: RelationshipStrengthListRelationFilter
  }

  export type MemberOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    passwordHash?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    roles?: MemberRoleOrderByRelationAggregateInput
    wallet?: WalletOrderByWithRelationInput
    transactionsSent?: TransactionOrderByRelationAggregateInput
    transactionsReceived?: TransactionOrderByRelationAggregateInput
    rewardsSent?: RewardOrderByRelationAggregateInput
    rewardsReceived?: RewardOrderByRelationAggregateInput
    evaluationsGiven?: EvaluationOrderByRelationAggregateInput
    relationshipsFrom?: RelationshipStrengthOrderByRelationAggregateInput
    relationshipsTo?: RelationshipStrengthOrderByRelationAggregateInput
  }

  export type MemberWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: MemberWhereInput | MemberWhereInput[]
    OR?: MemberWhereInput[]
    NOT?: MemberWhereInput | MemberWhereInput[]
    name?: StringFilter<"Member"> | string
    passwordHash?: StringNullableFilter<"Member"> | string | null
    createdAt?: DateTimeFilter<"Member"> | Date | string
    roles?: MemberRoleListRelationFilter
    wallet?: XOR<WalletNullableScalarRelationFilter, WalletWhereInput> | null
    transactionsSent?: TransactionListRelationFilter
    transactionsReceived?: TransactionListRelationFilter
    rewardsSent?: RewardListRelationFilter
    rewardsReceived?: RewardListRelationFilter
    evaluationsGiven?: EvaluationListRelationFilter
    relationshipsFrom?: RelationshipStrengthListRelationFilter
    relationshipsTo?: RelationshipStrengthListRelationFilter
  }, "id">

  export type MemberOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    passwordHash?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: MemberCountOrderByAggregateInput
    _max?: MemberMaxOrderByAggregateInput
    _min?: MemberMinOrderByAggregateInput
  }

  export type MemberScalarWhereWithAggregatesInput = {
    AND?: MemberScalarWhereWithAggregatesInput | MemberScalarWhereWithAggregatesInput[]
    OR?: MemberScalarWhereWithAggregatesInput[]
    NOT?: MemberScalarWhereWithAggregatesInput | MemberScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Member"> | string
    name?: StringWithAggregatesFilter<"Member"> | string
    passwordHash?: StringNullableWithAggregatesFilter<"Member"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Member"> | Date | string
  }

  export type MemberRoleWhereInput = {
    AND?: MemberRoleWhereInput | MemberRoleWhereInput[]
    OR?: MemberRoleWhereInput[]
    NOT?: MemberRoleWhereInput | MemberRoleWhereInput[]
    id?: StringFilter<"MemberRole"> | string
    memberId?: StringFilter<"MemberRole"> | string
    role?: EnumRoleFilter<"MemberRole"> | $Enums.Role
    member?: XOR<MemberScalarRelationFilter, MemberWhereInput>
  }

  export type MemberRoleOrderByWithRelationInput = {
    id?: SortOrder
    memberId?: SortOrder
    role?: SortOrder
    member?: MemberOrderByWithRelationInput
  }

  export type MemberRoleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    memberId_role?: MemberRoleMemberIdRoleCompoundUniqueInput
    AND?: MemberRoleWhereInput | MemberRoleWhereInput[]
    OR?: MemberRoleWhereInput[]
    NOT?: MemberRoleWhereInput | MemberRoleWhereInput[]
    memberId?: StringFilter<"MemberRole"> | string
    role?: EnumRoleFilter<"MemberRole"> | $Enums.Role
    member?: XOR<MemberScalarRelationFilter, MemberWhereInput>
  }, "id" | "memberId_role">

  export type MemberRoleOrderByWithAggregationInput = {
    id?: SortOrder
    memberId?: SortOrder
    role?: SortOrder
    _count?: MemberRoleCountOrderByAggregateInput
    _max?: MemberRoleMaxOrderByAggregateInput
    _min?: MemberRoleMinOrderByAggregateInput
  }

  export type MemberRoleScalarWhereWithAggregatesInput = {
    AND?: MemberRoleScalarWhereWithAggregatesInput | MemberRoleScalarWhereWithAggregatesInput[]
    OR?: MemberRoleScalarWhereWithAggregatesInput[]
    NOT?: MemberRoleScalarWhereWithAggregatesInput | MemberRoleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MemberRole"> | string
    memberId?: StringWithAggregatesFilter<"MemberRole"> | string
    role?: EnumRoleWithAggregatesFilter<"MemberRole"> | $Enums.Role
  }

  export type WalletWhereInput = {
    AND?: WalletWhereInput | WalletWhereInput[]
    OR?: WalletWhereInput[]
    NOT?: WalletWhereInput | WalletWhereInput[]
    id?: StringFilter<"Wallet"> | string
    memberId?: StringFilter<"Wallet"> | string
    currency?: StringFilter<"Wallet"> | string
    balance?: FloatFilter<"Wallet"> | number
    member?: XOR<MemberScalarRelationFilter, MemberWhereInput>
  }

  export type WalletOrderByWithRelationInput = {
    id?: SortOrder
    memberId?: SortOrder
    currency?: SortOrder
    balance?: SortOrder
    member?: MemberOrderByWithRelationInput
  }

  export type WalletWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    memberId?: string
    AND?: WalletWhereInput | WalletWhereInput[]
    OR?: WalletWhereInput[]
    NOT?: WalletWhereInput | WalletWhereInput[]
    currency?: StringFilter<"Wallet"> | string
    balance?: FloatFilter<"Wallet"> | number
    member?: XOR<MemberScalarRelationFilter, MemberWhereInput>
  }, "id" | "memberId">

  export type WalletOrderByWithAggregationInput = {
    id?: SortOrder
    memberId?: SortOrder
    currency?: SortOrder
    balance?: SortOrder
    _count?: WalletCountOrderByAggregateInput
    _avg?: WalletAvgOrderByAggregateInput
    _max?: WalletMaxOrderByAggregateInput
    _min?: WalletMinOrderByAggregateInput
    _sum?: WalletSumOrderByAggregateInput
  }

  export type WalletScalarWhereWithAggregatesInput = {
    AND?: WalletScalarWhereWithAggregatesInput | WalletScalarWhereWithAggregatesInput[]
    OR?: WalletScalarWhereWithAggregatesInput[]
    NOT?: WalletScalarWhereWithAggregatesInput | WalletScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Wallet"> | string
    memberId?: StringWithAggregatesFilter<"Wallet"> | string
    currency?: StringWithAggregatesFilter<"Wallet"> | string
    balance?: FloatWithAggregatesFilter<"Wallet"> | number
  }

  export type TransactionWhereInput = {
    AND?: TransactionWhereInput | TransactionWhereInput[]
    OR?: TransactionWhereInput[]
    NOT?: TransactionWhereInput | TransactionWhereInput[]
    id?: StringFilter<"Transaction"> | string
    senderId?: StringFilter<"Transaction"> | string
    recipientId?: StringFilter<"Transaction"> | string
    amount?: FloatFilter<"Transaction"> | number
    currency?: StringFilter<"Transaction"> | string
    note?: StringNullableFilter<"Transaction"> | string | null
    isPrivate?: BoolFilter<"Transaction"> | boolean
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    sender?: XOR<MemberScalarRelationFilter, MemberWhereInput>
    recipient?: XOR<MemberScalarRelationFilter, MemberWhereInput>
  }

  export type TransactionOrderByWithRelationInput = {
    id?: SortOrder
    senderId?: SortOrder
    recipientId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    note?: SortOrderInput | SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
    sender?: MemberOrderByWithRelationInput
    recipient?: MemberOrderByWithRelationInput
  }

  export type TransactionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TransactionWhereInput | TransactionWhereInput[]
    OR?: TransactionWhereInput[]
    NOT?: TransactionWhereInput | TransactionWhereInput[]
    senderId?: StringFilter<"Transaction"> | string
    recipientId?: StringFilter<"Transaction"> | string
    amount?: FloatFilter<"Transaction"> | number
    currency?: StringFilter<"Transaction"> | string
    note?: StringNullableFilter<"Transaction"> | string | null
    isPrivate?: BoolFilter<"Transaction"> | boolean
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    sender?: XOR<MemberScalarRelationFilter, MemberWhereInput>
    recipient?: XOR<MemberScalarRelationFilter, MemberWhereInput>
  }, "id">

  export type TransactionOrderByWithAggregationInput = {
    id?: SortOrder
    senderId?: SortOrder
    recipientId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    note?: SortOrderInput | SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
    _count?: TransactionCountOrderByAggregateInput
    _avg?: TransactionAvgOrderByAggregateInput
    _max?: TransactionMaxOrderByAggregateInput
    _min?: TransactionMinOrderByAggregateInput
    _sum?: TransactionSumOrderByAggregateInput
  }

  export type TransactionScalarWhereWithAggregatesInput = {
    AND?: TransactionScalarWhereWithAggregatesInput | TransactionScalarWhereWithAggregatesInput[]
    OR?: TransactionScalarWhereWithAggregatesInput[]
    NOT?: TransactionScalarWhereWithAggregatesInput | TransactionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Transaction"> | string
    senderId?: StringWithAggregatesFilter<"Transaction"> | string
    recipientId?: StringWithAggregatesFilter<"Transaction"> | string
    amount?: FloatWithAggregatesFilter<"Transaction"> | number
    currency?: StringWithAggregatesFilter<"Transaction"> | string
    note?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    isPrivate?: BoolWithAggregatesFilter<"Transaction"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Transaction"> | Date | string
  }

  export type RewardWhereInput = {
    AND?: RewardWhereInput | RewardWhereInput[]
    OR?: RewardWhereInput[]
    NOT?: RewardWhereInput | RewardWhereInput[]
    id?: StringFilter<"Reward"> | string
    senderId?: StringFilter<"Reward"> | string
    recipientId?: StringFilter<"Reward"> | string
    amount?: FloatFilter<"Reward"> | number
    currency?: StringFilter<"Reward"> | string
    note?: StringNullableFilter<"Reward"> | string | null
    isRecurring?: BoolFilter<"Reward"> | boolean
    createdAt?: DateTimeFilter<"Reward"> | Date | string
    sender?: XOR<MemberScalarRelationFilter, MemberWhereInput>
    recipient?: XOR<MemberScalarRelationFilter, MemberWhereInput>
  }

  export type RewardOrderByWithRelationInput = {
    id?: SortOrder
    senderId?: SortOrder
    recipientId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    note?: SortOrderInput | SortOrder
    isRecurring?: SortOrder
    createdAt?: SortOrder
    sender?: MemberOrderByWithRelationInput
    recipient?: MemberOrderByWithRelationInput
  }

  export type RewardWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RewardWhereInput | RewardWhereInput[]
    OR?: RewardWhereInput[]
    NOT?: RewardWhereInput | RewardWhereInput[]
    senderId?: StringFilter<"Reward"> | string
    recipientId?: StringFilter<"Reward"> | string
    amount?: FloatFilter<"Reward"> | number
    currency?: StringFilter<"Reward"> | string
    note?: StringNullableFilter<"Reward"> | string | null
    isRecurring?: BoolFilter<"Reward"> | boolean
    createdAt?: DateTimeFilter<"Reward"> | Date | string
    sender?: XOR<MemberScalarRelationFilter, MemberWhereInput>
    recipient?: XOR<MemberScalarRelationFilter, MemberWhereInput>
  }, "id">

  export type RewardOrderByWithAggregationInput = {
    id?: SortOrder
    senderId?: SortOrder
    recipientId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    note?: SortOrderInput | SortOrder
    isRecurring?: SortOrder
    createdAt?: SortOrder
    _count?: RewardCountOrderByAggregateInput
    _avg?: RewardAvgOrderByAggregateInput
    _max?: RewardMaxOrderByAggregateInput
    _min?: RewardMinOrderByAggregateInput
    _sum?: RewardSumOrderByAggregateInput
  }

  export type RewardScalarWhereWithAggregatesInput = {
    AND?: RewardScalarWhereWithAggregatesInput | RewardScalarWhereWithAggregatesInput[]
    OR?: RewardScalarWhereWithAggregatesInput[]
    NOT?: RewardScalarWhereWithAggregatesInput | RewardScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Reward"> | string
    senderId?: StringWithAggregatesFilter<"Reward"> | string
    recipientId?: StringWithAggregatesFilter<"Reward"> | string
    amount?: FloatWithAggregatesFilter<"Reward"> | number
    currency?: StringWithAggregatesFilter<"Reward"> | string
    note?: StringNullableWithAggregatesFilter<"Reward"> | string | null
    isRecurring?: BoolWithAggregatesFilter<"Reward"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Reward"> | Date | string
  }

  export type EvaluationWhereInput = {
    AND?: EvaluationWhereInput | EvaluationWhereInput[]
    OR?: EvaluationWhereInput[]
    NOT?: EvaluationWhereInput | EvaluationWhereInput[]
    id?: StringFilter<"Evaluation"> | string
    curatorId?: StringFilter<"Evaluation"> | string
    subject?: StringFilter<"Evaluation"> | string
    note?: StringNullableFilter<"Evaluation"> | string | null
    createdAt?: DateTimeFilter<"Evaluation"> | Date | string
    curator?: XOR<MemberScalarRelationFilter, MemberWhereInput>
  }

  export type EvaluationOrderByWithRelationInput = {
    id?: SortOrder
    curatorId?: SortOrder
    subject?: SortOrder
    note?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    curator?: MemberOrderByWithRelationInput
  }

  export type EvaluationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: EvaluationWhereInput | EvaluationWhereInput[]
    OR?: EvaluationWhereInput[]
    NOT?: EvaluationWhereInput | EvaluationWhereInput[]
    curatorId?: StringFilter<"Evaluation"> | string
    subject?: StringFilter<"Evaluation"> | string
    note?: StringNullableFilter<"Evaluation"> | string | null
    createdAt?: DateTimeFilter<"Evaluation"> | Date | string
    curator?: XOR<MemberScalarRelationFilter, MemberWhereInput>
  }, "id">

  export type EvaluationOrderByWithAggregationInput = {
    id?: SortOrder
    curatorId?: SortOrder
    subject?: SortOrder
    note?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: EvaluationCountOrderByAggregateInput
    _max?: EvaluationMaxOrderByAggregateInput
    _min?: EvaluationMinOrderByAggregateInput
  }

  export type EvaluationScalarWhereWithAggregatesInput = {
    AND?: EvaluationScalarWhereWithAggregatesInput | EvaluationScalarWhereWithAggregatesInput[]
    OR?: EvaluationScalarWhereWithAggregatesInput[]
    NOT?: EvaluationScalarWhereWithAggregatesInput | EvaluationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Evaluation"> | string
    curatorId?: StringWithAggregatesFilter<"Evaluation"> | string
    subject?: StringWithAggregatesFilter<"Evaluation"> | string
    note?: StringNullableWithAggregatesFilter<"Evaluation"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Evaluation"> | Date | string
  }

  export type RelationshipStrengthWhereInput = {
    AND?: RelationshipStrengthWhereInput | RelationshipStrengthWhereInput[]
    OR?: RelationshipStrengthWhereInput[]
    NOT?: RelationshipStrengthWhereInput | RelationshipStrengthWhereInput[]
    id?: StringFilter<"RelationshipStrength"> | string
    memberAId?: StringFilter<"RelationshipStrength"> | string
    memberBId?: StringFilter<"RelationshipStrength"> | string
    strength?: FloatFilter<"RelationshipStrength"> | number
    memberA?: XOR<MemberScalarRelationFilter, MemberWhereInput>
    memberB?: XOR<MemberScalarRelationFilter, MemberWhereInput>
  }

  export type RelationshipStrengthOrderByWithRelationInput = {
    id?: SortOrder
    memberAId?: SortOrder
    memberBId?: SortOrder
    strength?: SortOrder
    memberA?: MemberOrderByWithRelationInput
    memberB?: MemberOrderByWithRelationInput
  }

  export type RelationshipStrengthWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    memberAId_memberBId?: RelationshipStrengthMemberAIdMemberBIdCompoundUniqueInput
    AND?: RelationshipStrengthWhereInput | RelationshipStrengthWhereInput[]
    OR?: RelationshipStrengthWhereInput[]
    NOT?: RelationshipStrengthWhereInput | RelationshipStrengthWhereInput[]
    memberAId?: StringFilter<"RelationshipStrength"> | string
    memberBId?: StringFilter<"RelationshipStrength"> | string
    strength?: FloatFilter<"RelationshipStrength"> | number
    memberA?: XOR<MemberScalarRelationFilter, MemberWhereInput>
    memberB?: XOR<MemberScalarRelationFilter, MemberWhereInput>
  }, "id" | "memberAId_memberBId">

  export type RelationshipStrengthOrderByWithAggregationInput = {
    id?: SortOrder
    memberAId?: SortOrder
    memberBId?: SortOrder
    strength?: SortOrder
    _count?: RelationshipStrengthCountOrderByAggregateInput
    _avg?: RelationshipStrengthAvgOrderByAggregateInput
    _max?: RelationshipStrengthMaxOrderByAggregateInput
    _min?: RelationshipStrengthMinOrderByAggregateInput
    _sum?: RelationshipStrengthSumOrderByAggregateInput
  }

  export type RelationshipStrengthScalarWhereWithAggregatesInput = {
    AND?: RelationshipStrengthScalarWhereWithAggregatesInput | RelationshipStrengthScalarWhereWithAggregatesInput[]
    OR?: RelationshipStrengthScalarWhereWithAggregatesInput[]
    NOT?: RelationshipStrengthScalarWhereWithAggregatesInput | RelationshipStrengthScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"RelationshipStrength"> | string
    memberAId?: StringWithAggregatesFilter<"RelationshipStrength"> | string
    memberBId?: StringWithAggregatesFilter<"RelationshipStrength"> | string
    strength?: FloatWithAggregatesFilter<"RelationshipStrength"> | number
  }

  export type MemberCreateInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleCreateNestedManyWithoutMemberInput
    wallet?: WalletCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthCreateNestedManyWithoutMemberBInput
  }

  export type MemberUncheckedCreateInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleUncheckedCreateNestedManyWithoutMemberInput
    wallet?: WalletUncheckedCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionUncheckedCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionUncheckedCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardUncheckedCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardUncheckedCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationUncheckedCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberBInput
  }

  export type MemberUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUpdateManyWithoutMemberNestedInput
    wallet?: WalletUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUpdateManyWithoutMemberBNestedInput
  }

  export type MemberUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUncheckedUpdateManyWithoutMemberNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUncheckedUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUncheckedUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUncheckedUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUncheckedUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUncheckedUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUncheckedUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUncheckedUpdateManyWithoutMemberBNestedInput
  }

  export type MemberCreateManyInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
  }

  export type MemberUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MemberUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MemberRoleCreateInput = {
    id?: string
    role: $Enums.Role
    member: MemberCreateNestedOneWithoutRolesInput
  }

  export type MemberRoleUncheckedCreateInput = {
    id?: string
    memberId: string
    role: $Enums.Role
  }

  export type MemberRoleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    member?: MemberUpdateOneRequiredWithoutRolesNestedInput
  }

  export type MemberRoleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    memberId?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
  }

  export type MemberRoleCreateManyInput = {
    id?: string
    memberId: string
    role: $Enums.Role
  }

  export type MemberRoleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
  }

  export type MemberRoleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    memberId?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
  }

  export type WalletCreateInput = {
    id?: string
    currency?: string
    balance?: number
    member: MemberCreateNestedOneWithoutWalletInput
  }

  export type WalletUncheckedCreateInput = {
    id?: string
    memberId: string
    currency?: string
    balance?: number
  }

  export type WalletUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    currency?: StringFieldUpdateOperationsInput | string
    balance?: FloatFieldUpdateOperationsInput | number
    member?: MemberUpdateOneRequiredWithoutWalletNestedInput
  }

  export type WalletUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    memberId?: StringFieldUpdateOperationsInput | string
    currency?: StringFieldUpdateOperationsInput | string
    balance?: FloatFieldUpdateOperationsInput | number
  }

  export type WalletCreateManyInput = {
    id?: string
    memberId: string
    currency?: string
    balance?: number
  }

  export type WalletUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    currency?: StringFieldUpdateOperationsInput | string
    balance?: FloatFieldUpdateOperationsInput | number
  }

  export type WalletUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    memberId?: StringFieldUpdateOperationsInput | string
    currency?: StringFieldUpdateOperationsInput | string
    balance?: FloatFieldUpdateOperationsInput | number
  }

  export type TransactionCreateInput = {
    id?: string
    amount: number
    currency?: string
    note?: string | null
    isPrivate?: boolean
    createdAt?: Date | string
    sender: MemberCreateNestedOneWithoutTransactionsSentInput
    recipient: MemberCreateNestedOneWithoutTransactionsReceivedInput
  }

  export type TransactionUncheckedCreateInput = {
    id?: string
    senderId: string
    recipientId: string
    amount: number
    currency?: string
    note?: string | null
    isPrivate?: boolean
    createdAt?: Date | string
  }

  export type TransactionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: MemberUpdateOneRequiredWithoutTransactionsSentNestedInput
    recipient?: MemberUpdateOneRequiredWithoutTransactionsReceivedNestedInput
  }

  export type TransactionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    recipientId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateManyInput = {
    id?: string
    senderId: string
    recipientId: string
    amount: number
    currency?: string
    note?: string | null
    isPrivate?: boolean
    createdAt?: Date | string
  }

  export type TransactionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    recipientId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RewardCreateInput = {
    id?: string
    amount: number
    currency?: string
    note?: string | null
    isRecurring?: boolean
    createdAt?: Date | string
    sender: MemberCreateNestedOneWithoutRewardsSentInput
    recipient: MemberCreateNestedOneWithoutRewardsReceivedInput
  }

  export type RewardUncheckedCreateInput = {
    id?: string
    senderId: string
    recipientId: string
    amount: number
    currency?: string
    note?: string | null
    isRecurring?: boolean
    createdAt?: Date | string
  }

  export type RewardUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isRecurring?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: MemberUpdateOneRequiredWithoutRewardsSentNestedInput
    recipient?: MemberUpdateOneRequiredWithoutRewardsReceivedNestedInput
  }

  export type RewardUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    recipientId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isRecurring?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RewardCreateManyInput = {
    id?: string
    senderId: string
    recipientId: string
    amount: number
    currency?: string
    note?: string | null
    isRecurring?: boolean
    createdAt?: Date | string
  }

  export type RewardUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isRecurring?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RewardUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    recipientId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isRecurring?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EvaluationCreateInput = {
    id?: string
    subject: string
    note?: string | null
    createdAt?: Date | string
    curator: MemberCreateNestedOneWithoutEvaluationsGivenInput
  }

  export type EvaluationUncheckedCreateInput = {
    id?: string
    curatorId: string
    subject: string
    note?: string | null
    createdAt?: Date | string
  }

  export type EvaluationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    curator?: MemberUpdateOneRequiredWithoutEvaluationsGivenNestedInput
  }

  export type EvaluationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    curatorId?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EvaluationCreateManyInput = {
    id?: string
    curatorId: string
    subject: string
    note?: string | null
    createdAt?: Date | string
  }

  export type EvaluationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EvaluationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    curatorId?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RelationshipStrengthCreateInput = {
    id?: string
    strength?: number
    memberA: MemberCreateNestedOneWithoutRelationshipsFromInput
    memberB: MemberCreateNestedOneWithoutRelationshipsToInput
  }

  export type RelationshipStrengthUncheckedCreateInput = {
    id?: string
    memberAId: string
    memberBId: string
    strength?: number
  }

  export type RelationshipStrengthUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    strength?: FloatFieldUpdateOperationsInput | number
    memberA?: MemberUpdateOneRequiredWithoutRelationshipsFromNestedInput
    memberB?: MemberUpdateOneRequiredWithoutRelationshipsToNestedInput
  }

  export type RelationshipStrengthUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    memberAId?: StringFieldUpdateOperationsInput | string
    memberBId?: StringFieldUpdateOperationsInput | string
    strength?: FloatFieldUpdateOperationsInput | number
  }

  export type RelationshipStrengthCreateManyInput = {
    id?: string
    memberAId: string
    memberBId: string
    strength?: number
  }

  export type RelationshipStrengthUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    strength?: FloatFieldUpdateOperationsInput | number
  }

  export type RelationshipStrengthUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    memberAId?: StringFieldUpdateOperationsInput | string
    memberBId?: StringFieldUpdateOperationsInput | string
    strength?: FloatFieldUpdateOperationsInput | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type MemberRoleListRelationFilter = {
    every?: MemberRoleWhereInput
    some?: MemberRoleWhereInput
    none?: MemberRoleWhereInput
  }

  export type WalletNullableScalarRelationFilter = {
    is?: WalletWhereInput | null
    isNot?: WalletWhereInput | null
  }

  export type TransactionListRelationFilter = {
    every?: TransactionWhereInput
    some?: TransactionWhereInput
    none?: TransactionWhereInput
  }

  export type RewardListRelationFilter = {
    every?: RewardWhereInput
    some?: RewardWhereInput
    none?: RewardWhereInput
  }

  export type EvaluationListRelationFilter = {
    every?: EvaluationWhereInput
    some?: EvaluationWhereInput
    none?: EvaluationWhereInput
  }

  export type RelationshipStrengthListRelationFilter = {
    every?: RelationshipStrengthWhereInput
    some?: RelationshipStrengthWhereInput
    none?: RelationshipStrengthWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type MemberRoleOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TransactionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RewardOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EvaluationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RelationshipStrengthOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MemberCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    passwordHash?: SortOrder
    createdAt?: SortOrder
  }

  export type MemberMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    passwordHash?: SortOrder
    createdAt?: SortOrder
  }

  export type MemberMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    passwordHash?: SortOrder
    createdAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[]
    notIn?: $Enums.Role[]
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type MemberScalarRelationFilter = {
    is?: MemberWhereInput
    isNot?: MemberWhereInput
  }

  export type MemberRoleMemberIdRoleCompoundUniqueInput = {
    memberId: string
    role: $Enums.Role
  }

  export type MemberRoleCountOrderByAggregateInput = {
    id?: SortOrder
    memberId?: SortOrder
    role?: SortOrder
  }

  export type MemberRoleMaxOrderByAggregateInput = {
    id?: SortOrder
    memberId?: SortOrder
    role?: SortOrder
  }

  export type MemberRoleMinOrderByAggregateInput = {
    id?: SortOrder
    memberId?: SortOrder
    role?: SortOrder
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[]
    notIn?: $Enums.Role[]
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type WalletCountOrderByAggregateInput = {
    id?: SortOrder
    memberId?: SortOrder
    currency?: SortOrder
    balance?: SortOrder
  }

  export type WalletAvgOrderByAggregateInput = {
    balance?: SortOrder
  }

  export type WalletMaxOrderByAggregateInput = {
    id?: SortOrder
    memberId?: SortOrder
    currency?: SortOrder
    balance?: SortOrder
  }

  export type WalletMinOrderByAggregateInput = {
    id?: SortOrder
    memberId?: SortOrder
    currency?: SortOrder
    balance?: SortOrder
  }

  export type WalletSumOrderByAggregateInput = {
    balance?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type TransactionCountOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    recipientId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    note?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type TransactionMaxOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    recipientId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    note?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionMinOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    recipientId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    note?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type RewardCountOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    recipientId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    note?: SortOrder
    isRecurring?: SortOrder
    createdAt?: SortOrder
  }

  export type RewardAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type RewardMaxOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    recipientId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    note?: SortOrder
    isRecurring?: SortOrder
    createdAt?: SortOrder
  }

  export type RewardMinOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    recipientId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    note?: SortOrder
    isRecurring?: SortOrder
    createdAt?: SortOrder
  }

  export type RewardSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type EvaluationCountOrderByAggregateInput = {
    id?: SortOrder
    curatorId?: SortOrder
    subject?: SortOrder
    note?: SortOrder
    createdAt?: SortOrder
  }

  export type EvaluationMaxOrderByAggregateInput = {
    id?: SortOrder
    curatorId?: SortOrder
    subject?: SortOrder
    note?: SortOrder
    createdAt?: SortOrder
  }

  export type EvaluationMinOrderByAggregateInput = {
    id?: SortOrder
    curatorId?: SortOrder
    subject?: SortOrder
    note?: SortOrder
    createdAt?: SortOrder
  }

  export type RelationshipStrengthMemberAIdMemberBIdCompoundUniqueInput = {
    memberAId: string
    memberBId: string
  }

  export type RelationshipStrengthCountOrderByAggregateInput = {
    id?: SortOrder
    memberAId?: SortOrder
    memberBId?: SortOrder
    strength?: SortOrder
  }

  export type RelationshipStrengthAvgOrderByAggregateInput = {
    strength?: SortOrder
  }

  export type RelationshipStrengthMaxOrderByAggregateInput = {
    id?: SortOrder
    memberAId?: SortOrder
    memberBId?: SortOrder
    strength?: SortOrder
  }

  export type RelationshipStrengthMinOrderByAggregateInput = {
    id?: SortOrder
    memberAId?: SortOrder
    memberBId?: SortOrder
    strength?: SortOrder
  }

  export type RelationshipStrengthSumOrderByAggregateInput = {
    strength?: SortOrder
  }

  export type MemberRoleCreateNestedManyWithoutMemberInput = {
    create?: XOR<MemberRoleCreateWithoutMemberInput, MemberRoleUncheckedCreateWithoutMemberInput> | MemberRoleCreateWithoutMemberInput[] | MemberRoleUncheckedCreateWithoutMemberInput[]
    connectOrCreate?: MemberRoleCreateOrConnectWithoutMemberInput | MemberRoleCreateOrConnectWithoutMemberInput[]
    createMany?: MemberRoleCreateManyMemberInputEnvelope
    connect?: MemberRoleWhereUniqueInput | MemberRoleWhereUniqueInput[]
  }

  export type WalletCreateNestedOneWithoutMemberInput = {
    create?: XOR<WalletCreateWithoutMemberInput, WalletUncheckedCreateWithoutMemberInput>
    connectOrCreate?: WalletCreateOrConnectWithoutMemberInput
    connect?: WalletWhereUniqueInput
  }

  export type TransactionCreateNestedManyWithoutSenderInput = {
    create?: XOR<TransactionCreateWithoutSenderInput, TransactionUncheckedCreateWithoutSenderInput> | TransactionCreateWithoutSenderInput[] | TransactionUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutSenderInput | TransactionCreateOrConnectWithoutSenderInput[]
    createMany?: TransactionCreateManySenderInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type TransactionCreateNestedManyWithoutRecipientInput = {
    create?: XOR<TransactionCreateWithoutRecipientInput, TransactionUncheckedCreateWithoutRecipientInput> | TransactionCreateWithoutRecipientInput[] | TransactionUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutRecipientInput | TransactionCreateOrConnectWithoutRecipientInput[]
    createMany?: TransactionCreateManyRecipientInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type RewardCreateNestedManyWithoutSenderInput = {
    create?: XOR<RewardCreateWithoutSenderInput, RewardUncheckedCreateWithoutSenderInput> | RewardCreateWithoutSenderInput[] | RewardUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: RewardCreateOrConnectWithoutSenderInput | RewardCreateOrConnectWithoutSenderInput[]
    createMany?: RewardCreateManySenderInputEnvelope
    connect?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
  }

  export type RewardCreateNestedManyWithoutRecipientInput = {
    create?: XOR<RewardCreateWithoutRecipientInput, RewardUncheckedCreateWithoutRecipientInput> | RewardCreateWithoutRecipientInput[] | RewardUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: RewardCreateOrConnectWithoutRecipientInput | RewardCreateOrConnectWithoutRecipientInput[]
    createMany?: RewardCreateManyRecipientInputEnvelope
    connect?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
  }

  export type EvaluationCreateNestedManyWithoutCuratorInput = {
    create?: XOR<EvaluationCreateWithoutCuratorInput, EvaluationUncheckedCreateWithoutCuratorInput> | EvaluationCreateWithoutCuratorInput[] | EvaluationUncheckedCreateWithoutCuratorInput[]
    connectOrCreate?: EvaluationCreateOrConnectWithoutCuratorInput | EvaluationCreateOrConnectWithoutCuratorInput[]
    createMany?: EvaluationCreateManyCuratorInputEnvelope
    connect?: EvaluationWhereUniqueInput | EvaluationWhereUniqueInput[]
  }

  export type RelationshipStrengthCreateNestedManyWithoutMemberAInput = {
    create?: XOR<RelationshipStrengthCreateWithoutMemberAInput, RelationshipStrengthUncheckedCreateWithoutMemberAInput> | RelationshipStrengthCreateWithoutMemberAInput[] | RelationshipStrengthUncheckedCreateWithoutMemberAInput[]
    connectOrCreate?: RelationshipStrengthCreateOrConnectWithoutMemberAInput | RelationshipStrengthCreateOrConnectWithoutMemberAInput[]
    createMany?: RelationshipStrengthCreateManyMemberAInputEnvelope
    connect?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
  }

  export type RelationshipStrengthCreateNestedManyWithoutMemberBInput = {
    create?: XOR<RelationshipStrengthCreateWithoutMemberBInput, RelationshipStrengthUncheckedCreateWithoutMemberBInput> | RelationshipStrengthCreateWithoutMemberBInput[] | RelationshipStrengthUncheckedCreateWithoutMemberBInput[]
    connectOrCreate?: RelationshipStrengthCreateOrConnectWithoutMemberBInput | RelationshipStrengthCreateOrConnectWithoutMemberBInput[]
    createMany?: RelationshipStrengthCreateManyMemberBInputEnvelope
    connect?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
  }

  export type MemberRoleUncheckedCreateNestedManyWithoutMemberInput = {
    create?: XOR<MemberRoleCreateWithoutMemberInput, MemberRoleUncheckedCreateWithoutMemberInput> | MemberRoleCreateWithoutMemberInput[] | MemberRoleUncheckedCreateWithoutMemberInput[]
    connectOrCreate?: MemberRoleCreateOrConnectWithoutMemberInput | MemberRoleCreateOrConnectWithoutMemberInput[]
    createMany?: MemberRoleCreateManyMemberInputEnvelope
    connect?: MemberRoleWhereUniqueInput | MemberRoleWhereUniqueInput[]
  }

  export type WalletUncheckedCreateNestedOneWithoutMemberInput = {
    create?: XOR<WalletCreateWithoutMemberInput, WalletUncheckedCreateWithoutMemberInput>
    connectOrCreate?: WalletCreateOrConnectWithoutMemberInput
    connect?: WalletWhereUniqueInput
  }

  export type TransactionUncheckedCreateNestedManyWithoutSenderInput = {
    create?: XOR<TransactionCreateWithoutSenderInput, TransactionUncheckedCreateWithoutSenderInput> | TransactionCreateWithoutSenderInput[] | TransactionUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutSenderInput | TransactionCreateOrConnectWithoutSenderInput[]
    createMany?: TransactionCreateManySenderInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type TransactionUncheckedCreateNestedManyWithoutRecipientInput = {
    create?: XOR<TransactionCreateWithoutRecipientInput, TransactionUncheckedCreateWithoutRecipientInput> | TransactionCreateWithoutRecipientInput[] | TransactionUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutRecipientInput | TransactionCreateOrConnectWithoutRecipientInput[]
    createMany?: TransactionCreateManyRecipientInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type RewardUncheckedCreateNestedManyWithoutSenderInput = {
    create?: XOR<RewardCreateWithoutSenderInput, RewardUncheckedCreateWithoutSenderInput> | RewardCreateWithoutSenderInput[] | RewardUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: RewardCreateOrConnectWithoutSenderInput | RewardCreateOrConnectWithoutSenderInput[]
    createMany?: RewardCreateManySenderInputEnvelope
    connect?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
  }

  export type RewardUncheckedCreateNestedManyWithoutRecipientInput = {
    create?: XOR<RewardCreateWithoutRecipientInput, RewardUncheckedCreateWithoutRecipientInput> | RewardCreateWithoutRecipientInput[] | RewardUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: RewardCreateOrConnectWithoutRecipientInput | RewardCreateOrConnectWithoutRecipientInput[]
    createMany?: RewardCreateManyRecipientInputEnvelope
    connect?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
  }

  export type EvaluationUncheckedCreateNestedManyWithoutCuratorInput = {
    create?: XOR<EvaluationCreateWithoutCuratorInput, EvaluationUncheckedCreateWithoutCuratorInput> | EvaluationCreateWithoutCuratorInput[] | EvaluationUncheckedCreateWithoutCuratorInput[]
    connectOrCreate?: EvaluationCreateOrConnectWithoutCuratorInput | EvaluationCreateOrConnectWithoutCuratorInput[]
    createMany?: EvaluationCreateManyCuratorInputEnvelope
    connect?: EvaluationWhereUniqueInput | EvaluationWhereUniqueInput[]
  }

  export type RelationshipStrengthUncheckedCreateNestedManyWithoutMemberAInput = {
    create?: XOR<RelationshipStrengthCreateWithoutMemberAInput, RelationshipStrengthUncheckedCreateWithoutMemberAInput> | RelationshipStrengthCreateWithoutMemberAInput[] | RelationshipStrengthUncheckedCreateWithoutMemberAInput[]
    connectOrCreate?: RelationshipStrengthCreateOrConnectWithoutMemberAInput | RelationshipStrengthCreateOrConnectWithoutMemberAInput[]
    createMany?: RelationshipStrengthCreateManyMemberAInputEnvelope
    connect?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
  }

  export type RelationshipStrengthUncheckedCreateNestedManyWithoutMemberBInput = {
    create?: XOR<RelationshipStrengthCreateWithoutMemberBInput, RelationshipStrengthUncheckedCreateWithoutMemberBInput> | RelationshipStrengthCreateWithoutMemberBInput[] | RelationshipStrengthUncheckedCreateWithoutMemberBInput[]
    connectOrCreate?: RelationshipStrengthCreateOrConnectWithoutMemberBInput | RelationshipStrengthCreateOrConnectWithoutMemberBInput[]
    createMany?: RelationshipStrengthCreateManyMemberBInputEnvelope
    connect?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type MemberRoleUpdateManyWithoutMemberNestedInput = {
    create?: XOR<MemberRoleCreateWithoutMemberInput, MemberRoleUncheckedCreateWithoutMemberInput> | MemberRoleCreateWithoutMemberInput[] | MemberRoleUncheckedCreateWithoutMemberInput[]
    connectOrCreate?: MemberRoleCreateOrConnectWithoutMemberInput | MemberRoleCreateOrConnectWithoutMemberInput[]
    upsert?: MemberRoleUpsertWithWhereUniqueWithoutMemberInput | MemberRoleUpsertWithWhereUniqueWithoutMemberInput[]
    createMany?: MemberRoleCreateManyMemberInputEnvelope
    set?: MemberRoleWhereUniqueInput | MemberRoleWhereUniqueInput[]
    disconnect?: MemberRoleWhereUniqueInput | MemberRoleWhereUniqueInput[]
    delete?: MemberRoleWhereUniqueInput | MemberRoleWhereUniqueInput[]
    connect?: MemberRoleWhereUniqueInput | MemberRoleWhereUniqueInput[]
    update?: MemberRoleUpdateWithWhereUniqueWithoutMemberInput | MemberRoleUpdateWithWhereUniqueWithoutMemberInput[]
    updateMany?: MemberRoleUpdateManyWithWhereWithoutMemberInput | MemberRoleUpdateManyWithWhereWithoutMemberInput[]
    deleteMany?: MemberRoleScalarWhereInput | MemberRoleScalarWhereInput[]
  }

  export type WalletUpdateOneWithoutMemberNestedInput = {
    create?: XOR<WalletCreateWithoutMemberInput, WalletUncheckedCreateWithoutMemberInput>
    connectOrCreate?: WalletCreateOrConnectWithoutMemberInput
    upsert?: WalletUpsertWithoutMemberInput
    disconnect?: WalletWhereInput | boolean
    delete?: WalletWhereInput | boolean
    connect?: WalletWhereUniqueInput
    update?: XOR<XOR<WalletUpdateToOneWithWhereWithoutMemberInput, WalletUpdateWithoutMemberInput>, WalletUncheckedUpdateWithoutMemberInput>
  }

  export type TransactionUpdateManyWithoutSenderNestedInput = {
    create?: XOR<TransactionCreateWithoutSenderInput, TransactionUncheckedCreateWithoutSenderInput> | TransactionCreateWithoutSenderInput[] | TransactionUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutSenderInput | TransactionCreateOrConnectWithoutSenderInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutSenderInput | TransactionUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: TransactionCreateManySenderInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutSenderInput | TransactionUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutSenderInput | TransactionUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type TransactionUpdateManyWithoutRecipientNestedInput = {
    create?: XOR<TransactionCreateWithoutRecipientInput, TransactionUncheckedCreateWithoutRecipientInput> | TransactionCreateWithoutRecipientInput[] | TransactionUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutRecipientInput | TransactionCreateOrConnectWithoutRecipientInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutRecipientInput | TransactionUpsertWithWhereUniqueWithoutRecipientInput[]
    createMany?: TransactionCreateManyRecipientInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutRecipientInput | TransactionUpdateWithWhereUniqueWithoutRecipientInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutRecipientInput | TransactionUpdateManyWithWhereWithoutRecipientInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type RewardUpdateManyWithoutSenderNestedInput = {
    create?: XOR<RewardCreateWithoutSenderInput, RewardUncheckedCreateWithoutSenderInput> | RewardCreateWithoutSenderInput[] | RewardUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: RewardCreateOrConnectWithoutSenderInput | RewardCreateOrConnectWithoutSenderInput[]
    upsert?: RewardUpsertWithWhereUniqueWithoutSenderInput | RewardUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: RewardCreateManySenderInputEnvelope
    set?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    disconnect?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    delete?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    connect?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    update?: RewardUpdateWithWhereUniqueWithoutSenderInput | RewardUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: RewardUpdateManyWithWhereWithoutSenderInput | RewardUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: RewardScalarWhereInput | RewardScalarWhereInput[]
  }

  export type RewardUpdateManyWithoutRecipientNestedInput = {
    create?: XOR<RewardCreateWithoutRecipientInput, RewardUncheckedCreateWithoutRecipientInput> | RewardCreateWithoutRecipientInput[] | RewardUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: RewardCreateOrConnectWithoutRecipientInput | RewardCreateOrConnectWithoutRecipientInput[]
    upsert?: RewardUpsertWithWhereUniqueWithoutRecipientInput | RewardUpsertWithWhereUniqueWithoutRecipientInput[]
    createMany?: RewardCreateManyRecipientInputEnvelope
    set?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    disconnect?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    delete?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    connect?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    update?: RewardUpdateWithWhereUniqueWithoutRecipientInput | RewardUpdateWithWhereUniqueWithoutRecipientInput[]
    updateMany?: RewardUpdateManyWithWhereWithoutRecipientInput | RewardUpdateManyWithWhereWithoutRecipientInput[]
    deleteMany?: RewardScalarWhereInput | RewardScalarWhereInput[]
  }

  export type EvaluationUpdateManyWithoutCuratorNestedInput = {
    create?: XOR<EvaluationCreateWithoutCuratorInput, EvaluationUncheckedCreateWithoutCuratorInput> | EvaluationCreateWithoutCuratorInput[] | EvaluationUncheckedCreateWithoutCuratorInput[]
    connectOrCreate?: EvaluationCreateOrConnectWithoutCuratorInput | EvaluationCreateOrConnectWithoutCuratorInput[]
    upsert?: EvaluationUpsertWithWhereUniqueWithoutCuratorInput | EvaluationUpsertWithWhereUniqueWithoutCuratorInput[]
    createMany?: EvaluationCreateManyCuratorInputEnvelope
    set?: EvaluationWhereUniqueInput | EvaluationWhereUniqueInput[]
    disconnect?: EvaluationWhereUniqueInput | EvaluationWhereUniqueInput[]
    delete?: EvaluationWhereUniqueInput | EvaluationWhereUniqueInput[]
    connect?: EvaluationWhereUniqueInput | EvaluationWhereUniqueInput[]
    update?: EvaluationUpdateWithWhereUniqueWithoutCuratorInput | EvaluationUpdateWithWhereUniqueWithoutCuratorInput[]
    updateMany?: EvaluationUpdateManyWithWhereWithoutCuratorInput | EvaluationUpdateManyWithWhereWithoutCuratorInput[]
    deleteMany?: EvaluationScalarWhereInput | EvaluationScalarWhereInput[]
  }

  export type RelationshipStrengthUpdateManyWithoutMemberANestedInput = {
    create?: XOR<RelationshipStrengthCreateWithoutMemberAInput, RelationshipStrengthUncheckedCreateWithoutMemberAInput> | RelationshipStrengthCreateWithoutMemberAInput[] | RelationshipStrengthUncheckedCreateWithoutMemberAInput[]
    connectOrCreate?: RelationshipStrengthCreateOrConnectWithoutMemberAInput | RelationshipStrengthCreateOrConnectWithoutMemberAInput[]
    upsert?: RelationshipStrengthUpsertWithWhereUniqueWithoutMemberAInput | RelationshipStrengthUpsertWithWhereUniqueWithoutMemberAInput[]
    createMany?: RelationshipStrengthCreateManyMemberAInputEnvelope
    set?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    disconnect?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    delete?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    connect?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    update?: RelationshipStrengthUpdateWithWhereUniqueWithoutMemberAInput | RelationshipStrengthUpdateWithWhereUniqueWithoutMemberAInput[]
    updateMany?: RelationshipStrengthUpdateManyWithWhereWithoutMemberAInput | RelationshipStrengthUpdateManyWithWhereWithoutMemberAInput[]
    deleteMany?: RelationshipStrengthScalarWhereInput | RelationshipStrengthScalarWhereInput[]
  }

  export type RelationshipStrengthUpdateManyWithoutMemberBNestedInput = {
    create?: XOR<RelationshipStrengthCreateWithoutMemberBInput, RelationshipStrengthUncheckedCreateWithoutMemberBInput> | RelationshipStrengthCreateWithoutMemberBInput[] | RelationshipStrengthUncheckedCreateWithoutMemberBInput[]
    connectOrCreate?: RelationshipStrengthCreateOrConnectWithoutMemberBInput | RelationshipStrengthCreateOrConnectWithoutMemberBInput[]
    upsert?: RelationshipStrengthUpsertWithWhereUniqueWithoutMemberBInput | RelationshipStrengthUpsertWithWhereUniqueWithoutMemberBInput[]
    createMany?: RelationshipStrengthCreateManyMemberBInputEnvelope
    set?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    disconnect?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    delete?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    connect?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    update?: RelationshipStrengthUpdateWithWhereUniqueWithoutMemberBInput | RelationshipStrengthUpdateWithWhereUniqueWithoutMemberBInput[]
    updateMany?: RelationshipStrengthUpdateManyWithWhereWithoutMemberBInput | RelationshipStrengthUpdateManyWithWhereWithoutMemberBInput[]
    deleteMany?: RelationshipStrengthScalarWhereInput | RelationshipStrengthScalarWhereInput[]
  }

  export type MemberRoleUncheckedUpdateManyWithoutMemberNestedInput = {
    create?: XOR<MemberRoleCreateWithoutMemberInput, MemberRoleUncheckedCreateWithoutMemberInput> | MemberRoleCreateWithoutMemberInput[] | MemberRoleUncheckedCreateWithoutMemberInput[]
    connectOrCreate?: MemberRoleCreateOrConnectWithoutMemberInput | MemberRoleCreateOrConnectWithoutMemberInput[]
    upsert?: MemberRoleUpsertWithWhereUniqueWithoutMemberInput | MemberRoleUpsertWithWhereUniqueWithoutMemberInput[]
    createMany?: MemberRoleCreateManyMemberInputEnvelope
    set?: MemberRoleWhereUniqueInput | MemberRoleWhereUniqueInput[]
    disconnect?: MemberRoleWhereUniqueInput | MemberRoleWhereUniqueInput[]
    delete?: MemberRoleWhereUniqueInput | MemberRoleWhereUniqueInput[]
    connect?: MemberRoleWhereUniqueInput | MemberRoleWhereUniqueInput[]
    update?: MemberRoleUpdateWithWhereUniqueWithoutMemberInput | MemberRoleUpdateWithWhereUniqueWithoutMemberInput[]
    updateMany?: MemberRoleUpdateManyWithWhereWithoutMemberInput | MemberRoleUpdateManyWithWhereWithoutMemberInput[]
    deleteMany?: MemberRoleScalarWhereInput | MemberRoleScalarWhereInput[]
  }

  export type WalletUncheckedUpdateOneWithoutMemberNestedInput = {
    create?: XOR<WalletCreateWithoutMemberInput, WalletUncheckedCreateWithoutMemberInput>
    connectOrCreate?: WalletCreateOrConnectWithoutMemberInput
    upsert?: WalletUpsertWithoutMemberInput
    disconnect?: WalletWhereInput | boolean
    delete?: WalletWhereInput | boolean
    connect?: WalletWhereUniqueInput
    update?: XOR<XOR<WalletUpdateToOneWithWhereWithoutMemberInput, WalletUpdateWithoutMemberInput>, WalletUncheckedUpdateWithoutMemberInput>
  }

  export type TransactionUncheckedUpdateManyWithoutSenderNestedInput = {
    create?: XOR<TransactionCreateWithoutSenderInput, TransactionUncheckedCreateWithoutSenderInput> | TransactionCreateWithoutSenderInput[] | TransactionUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutSenderInput | TransactionCreateOrConnectWithoutSenderInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutSenderInput | TransactionUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: TransactionCreateManySenderInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutSenderInput | TransactionUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutSenderInput | TransactionUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type TransactionUncheckedUpdateManyWithoutRecipientNestedInput = {
    create?: XOR<TransactionCreateWithoutRecipientInput, TransactionUncheckedCreateWithoutRecipientInput> | TransactionCreateWithoutRecipientInput[] | TransactionUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutRecipientInput | TransactionCreateOrConnectWithoutRecipientInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutRecipientInput | TransactionUpsertWithWhereUniqueWithoutRecipientInput[]
    createMany?: TransactionCreateManyRecipientInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutRecipientInput | TransactionUpdateWithWhereUniqueWithoutRecipientInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutRecipientInput | TransactionUpdateManyWithWhereWithoutRecipientInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type RewardUncheckedUpdateManyWithoutSenderNestedInput = {
    create?: XOR<RewardCreateWithoutSenderInput, RewardUncheckedCreateWithoutSenderInput> | RewardCreateWithoutSenderInput[] | RewardUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: RewardCreateOrConnectWithoutSenderInput | RewardCreateOrConnectWithoutSenderInput[]
    upsert?: RewardUpsertWithWhereUniqueWithoutSenderInput | RewardUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: RewardCreateManySenderInputEnvelope
    set?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    disconnect?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    delete?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    connect?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    update?: RewardUpdateWithWhereUniqueWithoutSenderInput | RewardUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: RewardUpdateManyWithWhereWithoutSenderInput | RewardUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: RewardScalarWhereInput | RewardScalarWhereInput[]
  }

  export type RewardUncheckedUpdateManyWithoutRecipientNestedInput = {
    create?: XOR<RewardCreateWithoutRecipientInput, RewardUncheckedCreateWithoutRecipientInput> | RewardCreateWithoutRecipientInput[] | RewardUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: RewardCreateOrConnectWithoutRecipientInput | RewardCreateOrConnectWithoutRecipientInput[]
    upsert?: RewardUpsertWithWhereUniqueWithoutRecipientInput | RewardUpsertWithWhereUniqueWithoutRecipientInput[]
    createMany?: RewardCreateManyRecipientInputEnvelope
    set?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    disconnect?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    delete?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    connect?: RewardWhereUniqueInput | RewardWhereUniqueInput[]
    update?: RewardUpdateWithWhereUniqueWithoutRecipientInput | RewardUpdateWithWhereUniqueWithoutRecipientInput[]
    updateMany?: RewardUpdateManyWithWhereWithoutRecipientInput | RewardUpdateManyWithWhereWithoutRecipientInput[]
    deleteMany?: RewardScalarWhereInput | RewardScalarWhereInput[]
  }

  export type EvaluationUncheckedUpdateManyWithoutCuratorNestedInput = {
    create?: XOR<EvaluationCreateWithoutCuratorInput, EvaluationUncheckedCreateWithoutCuratorInput> | EvaluationCreateWithoutCuratorInput[] | EvaluationUncheckedCreateWithoutCuratorInput[]
    connectOrCreate?: EvaluationCreateOrConnectWithoutCuratorInput | EvaluationCreateOrConnectWithoutCuratorInput[]
    upsert?: EvaluationUpsertWithWhereUniqueWithoutCuratorInput | EvaluationUpsertWithWhereUniqueWithoutCuratorInput[]
    createMany?: EvaluationCreateManyCuratorInputEnvelope
    set?: EvaluationWhereUniqueInput | EvaluationWhereUniqueInput[]
    disconnect?: EvaluationWhereUniqueInput | EvaluationWhereUniqueInput[]
    delete?: EvaluationWhereUniqueInput | EvaluationWhereUniqueInput[]
    connect?: EvaluationWhereUniqueInput | EvaluationWhereUniqueInput[]
    update?: EvaluationUpdateWithWhereUniqueWithoutCuratorInput | EvaluationUpdateWithWhereUniqueWithoutCuratorInput[]
    updateMany?: EvaluationUpdateManyWithWhereWithoutCuratorInput | EvaluationUpdateManyWithWhereWithoutCuratorInput[]
    deleteMany?: EvaluationScalarWhereInput | EvaluationScalarWhereInput[]
  }

  export type RelationshipStrengthUncheckedUpdateManyWithoutMemberANestedInput = {
    create?: XOR<RelationshipStrengthCreateWithoutMemberAInput, RelationshipStrengthUncheckedCreateWithoutMemberAInput> | RelationshipStrengthCreateWithoutMemberAInput[] | RelationshipStrengthUncheckedCreateWithoutMemberAInput[]
    connectOrCreate?: RelationshipStrengthCreateOrConnectWithoutMemberAInput | RelationshipStrengthCreateOrConnectWithoutMemberAInput[]
    upsert?: RelationshipStrengthUpsertWithWhereUniqueWithoutMemberAInput | RelationshipStrengthUpsertWithWhereUniqueWithoutMemberAInput[]
    createMany?: RelationshipStrengthCreateManyMemberAInputEnvelope
    set?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    disconnect?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    delete?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    connect?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    update?: RelationshipStrengthUpdateWithWhereUniqueWithoutMemberAInput | RelationshipStrengthUpdateWithWhereUniqueWithoutMemberAInput[]
    updateMany?: RelationshipStrengthUpdateManyWithWhereWithoutMemberAInput | RelationshipStrengthUpdateManyWithWhereWithoutMemberAInput[]
    deleteMany?: RelationshipStrengthScalarWhereInput | RelationshipStrengthScalarWhereInput[]
  }

  export type RelationshipStrengthUncheckedUpdateManyWithoutMemberBNestedInput = {
    create?: XOR<RelationshipStrengthCreateWithoutMemberBInput, RelationshipStrengthUncheckedCreateWithoutMemberBInput> | RelationshipStrengthCreateWithoutMemberBInput[] | RelationshipStrengthUncheckedCreateWithoutMemberBInput[]
    connectOrCreate?: RelationshipStrengthCreateOrConnectWithoutMemberBInput | RelationshipStrengthCreateOrConnectWithoutMemberBInput[]
    upsert?: RelationshipStrengthUpsertWithWhereUniqueWithoutMemberBInput | RelationshipStrengthUpsertWithWhereUniqueWithoutMemberBInput[]
    createMany?: RelationshipStrengthCreateManyMemberBInputEnvelope
    set?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    disconnect?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    delete?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    connect?: RelationshipStrengthWhereUniqueInput | RelationshipStrengthWhereUniqueInput[]
    update?: RelationshipStrengthUpdateWithWhereUniqueWithoutMemberBInput | RelationshipStrengthUpdateWithWhereUniqueWithoutMemberBInput[]
    updateMany?: RelationshipStrengthUpdateManyWithWhereWithoutMemberBInput | RelationshipStrengthUpdateManyWithWhereWithoutMemberBInput[]
    deleteMany?: RelationshipStrengthScalarWhereInput | RelationshipStrengthScalarWhereInput[]
  }

  export type MemberCreateNestedOneWithoutRolesInput = {
    create?: XOR<MemberCreateWithoutRolesInput, MemberUncheckedCreateWithoutRolesInput>
    connectOrCreate?: MemberCreateOrConnectWithoutRolesInput
    connect?: MemberWhereUniqueInput
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type MemberUpdateOneRequiredWithoutRolesNestedInput = {
    create?: XOR<MemberCreateWithoutRolesInput, MemberUncheckedCreateWithoutRolesInput>
    connectOrCreate?: MemberCreateOrConnectWithoutRolesInput
    upsert?: MemberUpsertWithoutRolesInput
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutRolesInput, MemberUpdateWithoutRolesInput>, MemberUncheckedUpdateWithoutRolesInput>
  }

  export type MemberCreateNestedOneWithoutWalletInput = {
    create?: XOR<MemberCreateWithoutWalletInput, MemberUncheckedCreateWithoutWalletInput>
    connectOrCreate?: MemberCreateOrConnectWithoutWalletInput
    connect?: MemberWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type MemberUpdateOneRequiredWithoutWalletNestedInput = {
    create?: XOR<MemberCreateWithoutWalletInput, MemberUncheckedCreateWithoutWalletInput>
    connectOrCreate?: MemberCreateOrConnectWithoutWalletInput
    upsert?: MemberUpsertWithoutWalletInput
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutWalletInput, MemberUpdateWithoutWalletInput>, MemberUncheckedUpdateWithoutWalletInput>
  }

  export type MemberCreateNestedOneWithoutTransactionsSentInput = {
    create?: XOR<MemberCreateWithoutTransactionsSentInput, MemberUncheckedCreateWithoutTransactionsSentInput>
    connectOrCreate?: MemberCreateOrConnectWithoutTransactionsSentInput
    connect?: MemberWhereUniqueInput
  }

  export type MemberCreateNestedOneWithoutTransactionsReceivedInput = {
    create?: XOR<MemberCreateWithoutTransactionsReceivedInput, MemberUncheckedCreateWithoutTransactionsReceivedInput>
    connectOrCreate?: MemberCreateOrConnectWithoutTransactionsReceivedInput
    connect?: MemberWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type MemberUpdateOneRequiredWithoutTransactionsSentNestedInput = {
    create?: XOR<MemberCreateWithoutTransactionsSentInput, MemberUncheckedCreateWithoutTransactionsSentInput>
    connectOrCreate?: MemberCreateOrConnectWithoutTransactionsSentInput
    upsert?: MemberUpsertWithoutTransactionsSentInput
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutTransactionsSentInput, MemberUpdateWithoutTransactionsSentInput>, MemberUncheckedUpdateWithoutTransactionsSentInput>
  }

  export type MemberUpdateOneRequiredWithoutTransactionsReceivedNestedInput = {
    create?: XOR<MemberCreateWithoutTransactionsReceivedInput, MemberUncheckedCreateWithoutTransactionsReceivedInput>
    connectOrCreate?: MemberCreateOrConnectWithoutTransactionsReceivedInput
    upsert?: MemberUpsertWithoutTransactionsReceivedInput
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutTransactionsReceivedInput, MemberUpdateWithoutTransactionsReceivedInput>, MemberUncheckedUpdateWithoutTransactionsReceivedInput>
  }

  export type MemberCreateNestedOneWithoutRewardsSentInput = {
    create?: XOR<MemberCreateWithoutRewardsSentInput, MemberUncheckedCreateWithoutRewardsSentInput>
    connectOrCreate?: MemberCreateOrConnectWithoutRewardsSentInput
    connect?: MemberWhereUniqueInput
  }

  export type MemberCreateNestedOneWithoutRewardsReceivedInput = {
    create?: XOR<MemberCreateWithoutRewardsReceivedInput, MemberUncheckedCreateWithoutRewardsReceivedInput>
    connectOrCreate?: MemberCreateOrConnectWithoutRewardsReceivedInput
    connect?: MemberWhereUniqueInput
  }

  export type MemberUpdateOneRequiredWithoutRewardsSentNestedInput = {
    create?: XOR<MemberCreateWithoutRewardsSentInput, MemberUncheckedCreateWithoutRewardsSentInput>
    connectOrCreate?: MemberCreateOrConnectWithoutRewardsSentInput
    upsert?: MemberUpsertWithoutRewardsSentInput
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutRewardsSentInput, MemberUpdateWithoutRewardsSentInput>, MemberUncheckedUpdateWithoutRewardsSentInput>
  }

  export type MemberUpdateOneRequiredWithoutRewardsReceivedNestedInput = {
    create?: XOR<MemberCreateWithoutRewardsReceivedInput, MemberUncheckedCreateWithoutRewardsReceivedInput>
    connectOrCreate?: MemberCreateOrConnectWithoutRewardsReceivedInput
    upsert?: MemberUpsertWithoutRewardsReceivedInput
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutRewardsReceivedInput, MemberUpdateWithoutRewardsReceivedInput>, MemberUncheckedUpdateWithoutRewardsReceivedInput>
  }

  export type MemberCreateNestedOneWithoutEvaluationsGivenInput = {
    create?: XOR<MemberCreateWithoutEvaluationsGivenInput, MemberUncheckedCreateWithoutEvaluationsGivenInput>
    connectOrCreate?: MemberCreateOrConnectWithoutEvaluationsGivenInput
    connect?: MemberWhereUniqueInput
  }

  export type MemberUpdateOneRequiredWithoutEvaluationsGivenNestedInput = {
    create?: XOR<MemberCreateWithoutEvaluationsGivenInput, MemberUncheckedCreateWithoutEvaluationsGivenInput>
    connectOrCreate?: MemberCreateOrConnectWithoutEvaluationsGivenInput
    upsert?: MemberUpsertWithoutEvaluationsGivenInput
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutEvaluationsGivenInput, MemberUpdateWithoutEvaluationsGivenInput>, MemberUncheckedUpdateWithoutEvaluationsGivenInput>
  }

  export type MemberCreateNestedOneWithoutRelationshipsFromInput = {
    create?: XOR<MemberCreateWithoutRelationshipsFromInput, MemberUncheckedCreateWithoutRelationshipsFromInput>
    connectOrCreate?: MemberCreateOrConnectWithoutRelationshipsFromInput
    connect?: MemberWhereUniqueInput
  }

  export type MemberCreateNestedOneWithoutRelationshipsToInput = {
    create?: XOR<MemberCreateWithoutRelationshipsToInput, MemberUncheckedCreateWithoutRelationshipsToInput>
    connectOrCreate?: MemberCreateOrConnectWithoutRelationshipsToInput
    connect?: MemberWhereUniqueInput
  }

  export type MemberUpdateOneRequiredWithoutRelationshipsFromNestedInput = {
    create?: XOR<MemberCreateWithoutRelationshipsFromInput, MemberUncheckedCreateWithoutRelationshipsFromInput>
    connectOrCreate?: MemberCreateOrConnectWithoutRelationshipsFromInput
    upsert?: MemberUpsertWithoutRelationshipsFromInput
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutRelationshipsFromInput, MemberUpdateWithoutRelationshipsFromInput>, MemberUncheckedUpdateWithoutRelationshipsFromInput>
  }

  export type MemberUpdateOneRequiredWithoutRelationshipsToNestedInput = {
    create?: XOR<MemberCreateWithoutRelationshipsToInput, MemberUncheckedCreateWithoutRelationshipsToInput>
    connectOrCreate?: MemberCreateOrConnectWithoutRelationshipsToInput
    upsert?: MemberUpsertWithoutRelationshipsToInput
    connect?: MemberWhereUniqueInput
    update?: XOR<XOR<MemberUpdateToOneWithWhereWithoutRelationshipsToInput, MemberUpdateWithoutRelationshipsToInput>, MemberUncheckedUpdateWithoutRelationshipsToInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[]
    notIn?: $Enums.Role[]
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[]
    notIn?: $Enums.Role[]
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type MemberRoleCreateWithoutMemberInput = {
    id?: string
    role: $Enums.Role
  }

  export type MemberRoleUncheckedCreateWithoutMemberInput = {
    id?: string
    role: $Enums.Role
  }

  export type MemberRoleCreateOrConnectWithoutMemberInput = {
    where: MemberRoleWhereUniqueInput
    create: XOR<MemberRoleCreateWithoutMemberInput, MemberRoleUncheckedCreateWithoutMemberInput>
  }

  export type MemberRoleCreateManyMemberInputEnvelope = {
    data: MemberRoleCreateManyMemberInput | MemberRoleCreateManyMemberInput[]
  }

  export type WalletCreateWithoutMemberInput = {
    id?: string
    currency?: string
    balance?: number
  }

  export type WalletUncheckedCreateWithoutMemberInput = {
    id?: string
    currency?: string
    balance?: number
  }

  export type WalletCreateOrConnectWithoutMemberInput = {
    where: WalletWhereUniqueInput
    create: XOR<WalletCreateWithoutMemberInput, WalletUncheckedCreateWithoutMemberInput>
  }

  export type TransactionCreateWithoutSenderInput = {
    id?: string
    amount: number
    currency?: string
    note?: string | null
    isPrivate?: boolean
    createdAt?: Date | string
    recipient: MemberCreateNestedOneWithoutTransactionsReceivedInput
  }

  export type TransactionUncheckedCreateWithoutSenderInput = {
    id?: string
    recipientId: string
    amount: number
    currency?: string
    note?: string | null
    isPrivate?: boolean
    createdAt?: Date | string
  }

  export type TransactionCreateOrConnectWithoutSenderInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutSenderInput, TransactionUncheckedCreateWithoutSenderInput>
  }

  export type TransactionCreateManySenderInputEnvelope = {
    data: TransactionCreateManySenderInput | TransactionCreateManySenderInput[]
  }

  export type TransactionCreateWithoutRecipientInput = {
    id?: string
    amount: number
    currency?: string
    note?: string | null
    isPrivate?: boolean
    createdAt?: Date | string
    sender: MemberCreateNestedOneWithoutTransactionsSentInput
  }

  export type TransactionUncheckedCreateWithoutRecipientInput = {
    id?: string
    senderId: string
    amount: number
    currency?: string
    note?: string | null
    isPrivate?: boolean
    createdAt?: Date | string
  }

  export type TransactionCreateOrConnectWithoutRecipientInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutRecipientInput, TransactionUncheckedCreateWithoutRecipientInput>
  }

  export type TransactionCreateManyRecipientInputEnvelope = {
    data: TransactionCreateManyRecipientInput | TransactionCreateManyRecipientInput[]
  }

  export type RewardCreateWithoutSenderInput = {
    id?: string
    amount: number
    currency?: string
    note?: string | null
    isRecurring?: boolean
    createdAt?: Date | string
    recipient: MemberCreateNestedOneWithoutRewardsReceivedInput
  }

  export type RewardUncheckedCreateWithoutSenderInput = {
    id?: string
    recipientId: string
    amount: number
    currency?: string
    note?: string | null
    isRecurring?: boolean
    createdAt?: Date | string
  }

  export type RewardCreateOrConnectWithoutSenderInput = {
    where: RewardWhereUniqueInput
    create: XOR<RewardCreateWithoutSenderInput, RewardUncheckedCreateWithoutSenderInput>
  }

  export type RewardCreateManySenderInputEnvelope = {
    data: RewardCreateManySenderInput | RewardCreateManySenderInput[]
  }

  export type RewardCreateWithoutRecipientInput = {
    id?: string
    amount: number
    currency?: string
    note?: string | null
    isRecurring?: boolean
    createdAt?: Date | string
    sender: MemberCreateNestedOneWithoutRewardsSentInput
  }

  export type RewardUncheckedCreateWithoutRecipientInput = {
    id?: string
    senderId: string
    amount: number
    currency?: string
    note?: string | null
    isRecurring?: boolean
    createdAt?: Date | string
  }

  export type RewardCreateOrConnectWithoutRecipientInput = {
    where: RewardWhereUniqueInput
    create: XOR<RewardCreateWithoutRecipientInput, RewardUncheckedCreateWithoutRecipientInput>
  }

  export type RewardCreateManyRecipientInputEnvelope = {
    data: RewardCreateManyRecipientInput | RewardCreateManyRecipientInput[]
  }

  export type EvaluationCreateWithoutCuratorInput = {
    id?: string
    subject: string
    note?: string | null
    createdAt?: Date | string
  }

  export type EvaluationUncheckedCreateWithoutCuratorInput = {
    id?: string
    subject: string
    note?: string | null
    createdAt?: Date | string
  }

  export type EvaluationCreateOrConnectWithoutCuratorInput = {
    where: EvaluationWhereUniqueInput
    create: XOR<EvaluationCreateWithoutCuratorInput, EvaluationUncheckedCreateWithoutCuratorInput>
  }

  export type EvaluationCreateManyCuratorInputEnvelope = {
    data: EvaluationCreateManyCuratorInput | EvaluationCreateManyCuratorInput[]
  }

  export type RelationshipStrengthCreateWithoutMemberAInput = {
    id?: string
    strength?: number
    memberB: MemberCreateNestedOneWithoutRelationshipsToInput
  }

  export type RelationshipStrengthUncheckedCreateWithoutMemberAInput = {
    id?: string
    memberBId: string
    strength?: number
  }

  export type RelationshipStrengthCreateOrConnectWithoutMemberAInput = {
    where: RelationshipStrengthWhereUniqueInput
    create: XOR<RelationshipStrengthCreateWithoutMemberAInput, RelationshipStrengthUncheckedCreateWithoutMemberAInput>
  }

  export type RelationshipStrengthCreateManyMemberAInputEnvelope = {
    data: RelationshipStrengthCreateManyMemberAInput | RelationshipStrengthCreateManyMemberAInput[]
  }

  export type RelationshipStrengthCreateWithoutMemberBInput = {
    id?: string
    strength?: number
    memberA: MemberCreateNestedOneWithoutRelationshipsFromInput
  }

  export type RelationshipStrengthUncheckedCreateWithoutMemberBInput = {
    id?: string
    memberAId: string
    strength?: number
  }

  export type RelationshipStrengthCreateOrConnectWithoutMemberBInput = {
    where: RelationshipStrengthWhereUniqueInput
    create: XOR<RelationshipStrengthCreateWithoutMemberBInput, RelationshipStrengthUncheckedCreateWithoutMemberBInput>
  }

  export type RelationshipStrengthCreateManyMemberBInputEnvelope = {
    data: RelationshipStrengthCreateManyMemberBInput | RelationshipStrengthCreateManyMemberBInput[]
  }

  export type MemberRoleUpsertWithWhereUniqueWithoutMemberInput = {
    where: MemberRoleWhereUniqueInput
    update: XOR<MemberRoleUpdateWithoutMemberInput, MemberRoleUncheckedUpdateWithoutMemberInput>
    create: XOR<MemberRoleCreateWithoutMemberInput, MemberRoleUncheckedCreateWithoutMemberInput>
  }

  export type MemberRoleUpdateWithWhereUniqueWithoutMemberInput = {
    where: MemberRoleWhereUniqueInput
    data: XOR<MemberRoleUpdateWithoutMemberInput, MemberRoleUncheckedUpdateWithoutMemberInput>
  }

  export type MemberRoleUpdateManyWithWhereWithoutMemberInput = {
    where: MemberRoleScalarWhereInput
    data: XOR<MemberRoleUpdateManyMutationInput, MemberRoleUncheckedUpdateManyWithoutMemberInput>
  }

  export type MemberRoleScalarWhereInput = {
    AND?: MemberRoleScalarWhereInput | MemberRoleScalarWhereInput[]
    OR?: MemberRoleScalarWhereInput[]
    NOT?: MemberRoleScalarWhereInput | MemberRoleScalarWhereInput[]
    id?: StringFilter<"MemberRole"> | string
    memberId?: StringFilter<"MemberRole"> | string
    role?: EnumRoleFilter<"MemberRole"> | $Enums.Role
  }

  export type WalletUpsertWithoutMemberInput = {
    update: XOR<WalletUpdateWithoutMemberInput, WalletUncheckedUpdateWithoutMemberInput>
    create: XOR<WalletCreateWithoutMemberInput, WalletUncheckedCreateWithoutMemberInput>
    where?: WalletWhereInput
  }

  export type WalletUpdateToOneWithWhereWithoutMemberInput = {
    where?: WalletWhereInput
    data: XOR<WalletUpdateWithoutMemberInput, WalletUncheckedUpdateWithoutMemberInput>
  }

  export type WalletUpdateWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    currency?: StringFieldUpdateOperationsInput | string
    balance?: FloatFieldUpdateOperationsInput | number
  }

  export type WalletUncheckedUpdateWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    currency?: StringFieldUpdateOperationsInput | string
    balance?: FloatFieldUpdateOperationsInput | number
  }

  export type TransactionUpsertWithWhereUniqueWithoutSenderInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutSenderInput, TransactionUncheckedUpdateWithoutSenderInput>
    create: XOR<TransactionCreateWithoutSenderInput, TransactionUncheckedCreateWithoutSenderInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutSenderInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutSenderInput, TransactionUncheckedUpdateWithoutSenderInput>
  }

  export type TransactionUpdateManyWithWhereWithoutSenderInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutSenderInput>
  }

  export type TransactionScalarWhereInput = {
    AND?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
    OR?: TransactionScalarWhereInput[]
    NOT?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
    id?: StringFilter<"Transaction"> | string
    senderId?: StringFilter<"Transaction"> | string
    recipientId?: StringFilter<"Transaction"> | string
    amount?: FloatFilter<"Transaction"> | number
    currency?: StringFilter<"Transaction"> | string
    note?: StringNullableFilter<"Transaction"> | string | null
    isPrivate?: BoolFilter<"Transaction"> | boolean
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
  }

  export type TransactionUpsertWithWhereUniqueWithoutRecipientInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutRecipientInput, TransactionUncheckedUpdateWithoutRecipientInput>
    create: XOR<TransactionCreateWithoutRecipientInput, TransactionUncheckedCreateWithoutRecipientInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutRecipientInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutRecipientInput, TransactionUncheckedUpdateWithoutRecipientInput>
  }

  export type TransactionUpdateManyWithWhereWithoutRecipientInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutRecipientInput>
  }

  export type RewardUpsertWithWhereUniqueWithoutSenderInput = {
    where: RewardWhereUniqueInput
    update: XOR<RewardUpdateWithoutSenderInput, RewardUncheckedUpdateWithoutSenderInput>
    create: XOR<RewardCreateWithoutSenderInput, RewardUncheckedCreateWithoutSenderInput>
  }

  export type RewardUpdateWithWhereUniqueWithoutSenderInput = {
    where: RewardWhereUniqueInput
    data: XOR<RewardUpdateWithoutSenderInput, RewardUncheckedUpdateWithoutSenderInput>
  }

  export type RewardUpdateManyWithWhereWithoutSenderInput = {
    where: RewardScalarWhereInput
    data: XOR<RewardUpdateManyMutationInput, RewardUncheckedUpdateManyWithoutSenderInput>
  }

  export type RewardScalarWhereInput = {
    AND?: RewardScalarWhereInput | RewardScalarWhereInput[]
    OR?: RewardScalarWhereInput[]
    NOT?: RewardScalarWhereInput | RewardScalarWhereInput[]
    id?: StringFilter<"Reward"> | string
    senderId?: StringFilter<"Reward"> | string
    recipientId?: StringFilter<"Reward"> | string
    amount?: FloatFilter<"Reward"> | number
    currency?: StringFilter<"Reward"> | string
    note?: StringNullableFilter<"Reward"> | string | null
    isRecurring?: BoolFilter<"Reward"> | boolean
    createdAt?: DateTimeFilter<"Reward"> | Date | string
  }

  export type RewardUpsertWithWhereUniqueWithoutRecipientInput = {
    where: RewardWhereUniqueInput
    update: XOR<RewardUpdateWithoutRecipientInput, RewardUncheckedUpdateWithoutRecipientInput>
    create: XOR<RewardCreateWithoutRecipientInput, RewardUncheckedCreateWithoutRecipientInput>
  }

  export type RewardUpdateWithWhereUniqueWithoutRecipientInput = {
    where: RewardWhereUniqueInput
    data: XOR<RewardUpdateWithoutRecipientInput, RewardUncheckedUpdateWithoutRecipientInput>
  }

  export type RewardUpdateManyWithWhereWithoutRecipientInput = {
    where: RewardScalarWhereInput
    data: XOR<RewardUpdateManyMutationInput, RewardUncheckedUpdateManyWithoutRecipientInput>
  }

  export type EvaluationUpsertWithWhereUniqueWithoutCuratorInput = {
    where: EvaluationWhereUniqueInput
    update: XOR<EvaluationUpdateWithoutCuratorInput, EvaluationUncheckedUpdateWithoutCuratorInput>
    create: XOR<EvaluationCreateWithoutCuratorInput, EvaluationUncheckedCreateWithoutCuratorInput>
  }

  export type EvaluationUpdateWithWhereUniqueWithoutCuratorInput = {
    where: EvaluationWhereUniqueInput
    data: XOR<EvaluationUpdateWithoutCuratorInput, EvaluationUncheckedUpdateWithoutCuratorInput>
  }

  export type EvaluationUpdateManyWithWhereWithoutCuratorInput = {
    where: EvaluationScalarWhereInput
    data: XOR<EvaluationUpdateManyMutationInput, EvaluationUncheckedUpdateManyWithoutCuratorInput>
  }

  export type EvaluationScalarWhereInput = {
    AND?: EvaluationScalarWhereInput | EvaluationScalarWhereInput[]
    OR?: EvaluationScalarWhereInput[]
    NOT?: EvaluationScalarWhereInput | EvaluationScalarWhereInput[]
    id?: StringFilter<"Evaluation"> | string
    curatorId?: StringFilter<"Evaluation"> | string
    subject?: StringFilter<"Evaluation"> | string
    note?: StringNullableFilter<"Evaluation"> | string | null
    createdAt?: DateTimeFilter<"Evaluation"> | Date | string
  }

  export type RelationshipStrengthUpsertWithWhereUniqueWithoutMemberAInput = {
    where: RelationshipStrengthWhereUniqueInput
    update: XOR<RelationshipStrengthUpdateWithoutMemberAInput, RelationshipStrengthUncheckedUpdateWithoutMemberAInput>
    create: XOR<RelationshipStrengthCreateWithoutMemberAInput, RelationshipStrengthUncheckedCreateWithoutMemberAInput>
  }

  export type RelationshipStrengthUpdateWithWhereUniqueWithoutMemberAInput = {
    where: RelationshipStrengthWhereUniqueInput
    data: XOR<RelationshipStrengthUpdateWithoutMemberAInput, RelationshipStrengthUncheckedUpdateWithoutMemberAInput>
  }

  export type RelationshipStrengthUpdateManyWithWhereWithoutMemberAInput = {
    where: RelationshipStrengthScalarWhereInput
    data: XOR<RelationshipStrengthUpdateManyMutationInput, RelationshipStrengthUncheckedUpdateManyWithoutMemberAInput>
  }

  export type RelationshipStrengthScalarWhereInput = {
    AND?: RelationshipStrengthScalarWhereInput | RelationshipStrengthScalarWhereInput[]
    OR?: RelationshipStrengthScalarWhereInput[]
    NOT?: RelationshipStrengthScalarWhereInput | RelationshipStrengthScalarWhereInput[]
    id?: StringFilter<"RelationshipStrength"> | string
    memberAId?: StringFilter<"RelationshipStrength"> | string
    memberBId?: StringFilter<"RelationshipStrength"> | string
    strength?: FloatFilter<"RelationshipStrength"> | number
  }

  export type RelationshipStrengthUpsertWithWhereUniqueWithoutMemberBInput = {
    where: RelationshipStrengthWhereUniqueInput
    update: XOR<RelationshipStrengthUpdateWithoutMemberBInput, RelationshipStrengthUncheckedUpdateWithoutMemberBInput>
    create: XOR<RelationshipStrengthCreateWithoutMemberBInput, RelationshipStrengthUncheckedCreateWithoutMemberBInput>
  }

  export type RelationshipStrengthUpdateWithWhereUniqueWithoutMemberBInput = {
    where: RelationshipStrengthWhereUniqueInput
    data: XOR<RelationshipStrengthUpdateWithoutMemberBInput, RelationshipStrengthUncheckedUpdateWithoutMemberBInput>
  }

  export type RelationshipStrengthUpdateManyWithWhereWithoutMemberBInput = {
    where: RelationshipStrengthScalarWhereInput
    data: XOR<RelationshipStrengthUpdateManyMutationInput, RelationshipStrengthUncheckedUpdateManyWithoutMemberBInput>
  }

  export type MemberCreateWithoutRolesInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    wallet?: WalletCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthCreateNestedManyWithoutMemberBInput
  }

  export type MemberUncheckedCreateWithoutRolesInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    wallet?: WalletUncheckedCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionUncheckedCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionUncheckedCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardUncheckedCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardUncheckedCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationUncheckedCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberBInput
  }

  export type MemberCreateOrConnectWithoutRolesInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutRolesInput, MemberUncheckedCreateWithoutRolesInput>
  }

  export type MemberUpsertWithoutRolesInput = {
    update: XOR<MemberUpdateWithoutRolesInput, MemberUncheckedUpdateWithoutRolesInput>
    create: XOR<MemberCreateWithoutRolesInput, MemberUncheckedCreateWithoutRolesInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutRolesInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutRolesInput, MemberUncheckedUpdateWithoutRolesInput>
  }

  export type MemberUpdateWithoutRolesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    wallet?: WalletUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUpdateManyWithoutMemberBNestedInput
  }

  export type MemberUncheckedUpdateWithoutRolesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    wallet?: WalletUncheckedUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUncheckedUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUncheckedUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUncheckedUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUncheckedUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUncheckedUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUncheckedUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUncheckedUpdateManyWithoutMemberBNestedInput
  }

  export type MemberCreateWithoutWalletInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleCreateNestedManyWithoutMemberInput
    transactionsSent?: TransactionCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthCreateNestedManyWithoutMemberBInput
  }

  export type MemberUncheckedCreateWithoutWalletInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleUncheckedCreateNestedManyWithoutMemberInput
    transactionsSent?: TransactionUncheckedCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionUncheckedCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardUncheckedCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardUncheckedCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationUncheckedCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberBInput
  }

  export type MemberCreateOrConnectWithoutWalletInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutWalletInput, MemberUncheckedCreateWithoutWalletInput>
  }

  export type MemberUpsertWithoutWalletInput = {
    update: XOR<MemberUpdateWithoutWalletInput, MemberUncheckedUpdateWithoutWalletInput>
    create: XOR<MemberCreateWithoutWalletInput, MemberUncheckedCreateWithoutWalletInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutWalletInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutWalletInput, MemberUncheckedUpdateWithoutWalletInput>
  }

  export type MemberUpdateWithoutWalletInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUpdateManyWithoutMemberNestedInput
    transactionsSent?: TransactionUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUpdateManyWithoutMemberBNestedInput
  }

  export type MemberUncheckedUpdateWithoutWalletInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUncheckedUpdateManyWithoutMemberNestedInput
    transactionsSent?: TransactionUncheckedUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUncheckedUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUncheckedUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUncheckedUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUncheckedUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUncheckedUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUncheckedUpdateManyWithoutMemberBNestedInput
  }

  export type MemberCreateWithoutTransactionsSentInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleCreateNestedManyWithoutMemberInput
    wallet?: WalletCreateNestedOneWithoutMemberInput
    transactionsReceived?: TransactionCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthCreateNestedManyWithoutMemberBInput
  }

  export type MemberUncheckedCreateWithoutTransactionsSentInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleUncheckedCreateNestedManyWithoutMemberInput
    wallet?: WalletUncheckedCreateNestedOneWithoutMemberInput
    transactionsReceived?: TransactionUncheckedCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardUncheckedCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardUncheckedCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationUncheckedCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberBInput
  }

  export type MemberCreateOrConnectWithoutTransactionsSentInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutTransactionsSentInput, MemberUncheckedCreateWithoutTransactionsSentInput>
  }

  export type MemberCreateWithoutTransactionsReceivedInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleCreateNestedManyWithoutMemberInput
    wallet?: WalletCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionCreateNestedManyWithoutSenderInput
    rewardsSent?: RewardCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthCreateNestedManyWithoutMemberBInput
  }

  export type MemberUncheckedCreateWithoutTransactionsReceivedInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleUncheckedCreateNestedManyWithoutMemberInput
    wallet?: WalletUncheckedCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionUncheckedCreateNestedManyWithoutSenderInput
    rewardsSent?: RewardUncheckedCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardUncheckedCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationUncheckedCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberBInput
  }

  export type MemberCreateOrConnectWithoutTransactionsReceivedInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutTransactionsReceivedInput, MemberUncheckedCreateWithoutTransactionsReceivedInput>
  }

  export type MemberUpsertWithoutTransactionsSentInput = {
    update: XOR<MemberUpdateWithoutTransactionsSentInput, MemberUncheckedUpdateWithoutTransactionsSentInput>
    create: XOR<MemberCreateWithoutTransactionsSentInput, MemberUncheckedCreateWithoutTransactionsSentInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutTransactionsSentInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutTransactionsSentInput, MemberUncheckedUpdateWithoutTransactionsSentInput>
  }

  export type MemberUpdateWithoutTransactionsSentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUpdateManyWithoutMemberNestedInput
    wallet?: WalletUpdateOneWithoutMemberNestedInput
    transactionsReceived?: TransactionUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUpdateManyWithoutMemberBNestedInput
  }

  export type MemberUncheckedUpdateWithoutTransactionsSentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUncheckedUpdateManyWithoutMemberNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutMemberNestedInput
    transactionsReceived?: TransactionUncheckedUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUncheckedUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUncheckedUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUncheckedUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUncheckedUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUncheckedUpdateManyWithoutMemberBNestedInput
  }

  export type MemberUpsertWithoutTransactionsReceivedInput = {
    update: XOR<MemberUpdateWithoutTransactionsReceivedInput, MemberUncheckedUpdateWithoutTransactionsReceivedInput>
    create: XOR<MemberCreateWithoutTransactionsReceivedInput, MemberUncheckedCreateWithoutTransactionsReceivedInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutTransactionsReceivedInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutTransactionsReceivedInput, MemberUncheckedUpdateWithoutTransactionsReceivedInput>
  }

  export type MemberUpdateWithoutTransactionsReceivedInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUpdateManyWithoutMemberNestedInput
    wallet?: WalletUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUpdateManyWithoutSenderNestedInput
    rewardsSent?: RewardUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUpdateManyWithoutMemberBNestedInput
  }

  export type MemberUncheckedUpdateWithoutTransactionsReceivedInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUncheckedUpdateManyWithoutMemberNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUncheckedUpdateManyWithoutSenderNestedInput
    rewardsSent?: RewardUncheckedUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUncheckedUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUncheckedUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUncheckedUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUncheckedUpdateManyWithoutMemberBNestedInput
  }

  export type MemberCreateWithoutRewardsSentInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleCreateNestedManyWithoutMemberInput
    wallet?: WalletCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionCreateNestedManyWithoutRecipientInput
    rewardsReceived?: RewardCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthCreateNestedManyWithoutMemberBInput
  }

  export type MemberUncheckedCreateWithoutRewardsSentInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleUncheckedCreateNestedManyWithoutMemberInput
    wallet?: WalletUncheckedCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionUncheckedCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionUncheckedCreateNestedManyWithoutRecipientInput
    rewardsReceived?: RewardUncheckedCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationUncheckedCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberBInput
  }

  export type MemberCreateOrConnectWithoutRewardsSentInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutRewardsSentInput, MemberUncheckedCreateWithoutRewardsSentInput>
  }

  export type MemberCreateWithoutRewardsReceivedInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleCreateNestedManyWithoutMemberInput
    wallet?: WalletCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardCreateNestedManyWithoutSenderInput
    evaluationsGiven?: EvaluationCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthCreateNestedManyWithoutMemberBInput
  }

  export type MemberUncheckedCreateWithoutRewardsReceivedInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleUncheckedCreateNestedManyWithoutMemberInput
    wallet?: WalletUncheckedCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionUncheckedCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionUncheckedCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardUncheckedCreateNestedManyWithoutSenderInput
    evaluationsGiven?: EvaluationUncheckedCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberBInput
  }

  export type MemberCreateOrConnectWithoutRewardsReceivedInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutRewardsReceivedInput, MemberUncheckedCreateWithoutRewardsReceivedInput>
  }

  export type MemberUpsertWithoutRewardsSentInput = {
    update: XOR<MemberUpdateWithoutRewardsSentInput, MemberUncheckedUpdateWithoutRewardsSentInput>
    create: XOR<MemberCreateWithoutRewardsSentInput, MemberUncheckedCreateWithoutRewardsSentInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutRewardsSentInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutRewardsSentInput, MemberUncheckedUpdateWithoutRewardsSentInput>
  }

  export type MemberUpdateWithoutRewardsSentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUpdateManyWithoutMemberNestedInput
    wallet?: WalletUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUpdateManyWithoutRecipientNestedInput
    rewardsReceived?: RewardUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUpdateManyWithoutMemberBNestedInput
  }

  export type MemberUncheckedUpdateWithoutRewardsSentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUncheckedUpdateManyWithoutMemberNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUncheckedUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUncheckedUpdateManyWithoutRecipientNestedInput
    rewardsReceived?: RewardUncheckedUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUncheckedUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUncheckedUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUncheckedUpdateManyWithoutMemberBNestedInput
  }

  export type MemberUpsertWithoutRewardsReceivedInput = {
    update: XOR<MemberUpdateWithoutRewardsReceivedInput, MemberUncheckedUpdateWithoutRewardsReceivedInput>
    create: XOR<MemberCreateWithoutRewardsReceivedInput, MemberUncheckedCreateWithoutRewardsReceivedInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutRewardsReceivedInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutRewardsReceivedInput, MemberUncheckedUpdateWithoutRewardsReceivedInput>
  }

  export type MemberUpdateWithoutRewardsReceivedInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUpdateManyWithoutMemberNestedInput
    wallet?: WalletUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUpdateManyWithoutSenderNestedInput
    evaluationsGiven?: EvaluationUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUpdateManyWithoutMemberBNestedInput
  }

  export type MemberUncheckedUpdateWithoutRewardsReceivedInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUncheckedUpdateManyWithoutMemberNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUncheckedUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUncheckedUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUncheckedUpdateManyWithoutSenderNestedInput
    evaluationsGiven?: EvaluationUncheckedUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUncheckedUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUncheckedUpdateManyWithoutMemberBNestedInput
  }

  export type MemberCreateWithoutEvaluationsGivenInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleCreateNestedManyWithoutMemberInput
    wallet?: WalletCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardCreateNestedManyWithoutRecipientInput
    relationshipsFrom?: RelationshipStrengthCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthCreateNestedManyWithoutMemberBInput
  }

  export type MemberUncheckedCreateWithoutEvaluationsGivenInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleUncheckedCreateNestedManyWithoutMemberInput
    wallet?: WalletUncheckedCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionUncheckedCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionUncheckedCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardUncheckedCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardUncheckedCreateNestedManyWithoutRecipientInput
    relationshipsFrom?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberAInput
    relationshipsTo?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberBInput
  }

  export type MemberCreateOrConnectWithoutEvaluationsGivenInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutEvaluationsGivenInput, MemberUncheckedCreateWithoutEvaluationsGivenInput>
  }

  export type MemberUpsertWithoutEvaluationsGivenInput = {
    update: XOR<MemberUpdateWithoutEvaluationsGivenInput, MemberUncheckedUpdateWithoutEvaluationsGivenInput>
    create: XOR<MemberCreateWithoutEvaluationsGivenInput, MemberUncheckedCreateWithoutEvaluationsGivenInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutEvaluationsGivenInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutEvaluationsGivenInput, MemberUncheckedUpdateWithoutEvaluationsGivenInput>
  }

  export type MemberUpdateWithoutEvaluationsGivenInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUpdateManyWithoutMemberNestedInput
    wallet?: WalletUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUpdateManyWithoutRecipientNestedInput
    relationshipsFrom?: RelationshipStrengthUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUpdateManyWithoutMemberBNestedInput
  }

  export type MemberUncheckedUpdateWithoutEvaluationsGivenInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUncheckedUpdateManyWithoutMemberNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUncheckedUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUncheckedUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUncheckedUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUncheckedUpdateManyWithoutRecipientNestedInput
    relationshipsFrom?: RelationshipStrengthUncheckedUpdateManyWithoutMemberANestedInput
    relationshipsTo?: RelationshipStrengthUncheckedUpdateManyWithoutMemberBNestedInput
  }

  export type MemberCreateWithoutRelationshipsFromInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleCreateNestedManyWithoutMemberInput
    wallet?: WalletCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationCreateNestedManyWithoutCuratorInput
    relationshipsTo?: RelationshipStrengthCreateNestedManyWithoutMemberBInput
  }

  export type MemberUncheckedCreateWithoutRelationshipsFromInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleUncheckedCreateNestedManyWithoutMemberInput
    wallet?: WalletUncheckedCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionUncheckedCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionUncheckedCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardUncheckedCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardUncheckedCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationUncheckedCreateNestedManyWithoutCuratorInput
    relationshipsTo?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberBInput
  }

  export type MemberCreateOrConnectWithoutRelationshipsFromInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutRelationshipsFromInput, MemberUncheckedCreateWithoutRelationshipsFromInput>
  }

  export type MemberCreateWithoutRelationshipsToInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleCreateNestedManyWithoutMemberInput
    wallet?: WalletCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthCreateNestedManyWithoutMemberAInput
  }

  export type MemberUncheckedCreateWithoutRelationshipsToInput = {
    id?: string
    name: string
    passwordHash?: string | null
    createdAt?: Date | string
    roles?: MemberRoleUncheckedCreateNestedManyWithoutMemberInput
    wallet?: WalletUncheckedCreateNestedOneWithoutMemberInput
    transactionsSent?: TransactionUncheckedCreateNestedManyWithoutSenderInput
    transactionsReceived?: TransactionUncheckedCreateNestedManyWithoutRecipientInput
    rewardsSent?: RewardUncheckedCreateNestedManyWithoutSenderInput
    rewardsReceived?: RewardUncheckedCreateNestedManyWithoutRecipientInput
    evaluationsGiven?: EvaluationUncheckedCreateNestedManyWithoutCuratorInput
    relationshipsFrom?: RelationshipStrengthUncheckedCreateNestedManyWithoutMemberAInput
  }

  export type MemberCreateOrConnectWithoutRelationshipsToInput = {
    where: MemberWhereUniqueInput
    create: XOR<MemberCreateWithoutRelationshipsToInput, MemberUncheckedCreateWithoutRelationshipsToInput>
  }

  export type MemberUpsertWithoutRelationshipsFromInput = {
    update: XOR<MemberUpdateWithoutRelationshipsFromInput, MemberUncheckedUpdateWithoutRelationshipsFromInput>
    create: XOR<MemberCreateWithoutRelationshipsFromInput, MemberUncheckedCreateWithoutRelationshipsFromInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutRelationshipsFromInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutRelationshipsFromInput, MemberUncheckedUpdateWithoutRelationshipsFromInput>
  }

  export type MemberUpdateWithoutRelationshipsFromInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUpdateManyWithoutMemberNestedInput
    wallet?: WalletUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUpdateManyWithoutCuratorNestedInput
    relationshipsTo?: RelationshipStrengthUpdateManyWithoutMemberBNestedInput
  }

  export type MemberUncheckedUpdateWithoutRelationshipsFromInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUncheckedUpdateManyWithoutMemberNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUncheckedUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUncheckedUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUncheckedUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUncheckedUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUncheckedUpdateManyWithoutCuratorNestedInput
    relationshipsTo?: RelationshipStrengthUncheckedUpdateManyWithoutMemberBNestedInput
  }

  export type MemberUpsertWithoutRelationshipsToInput = {
    update: XOR<MemberUpdateWithoutRelationshipsToInput, MemberUncheckedUpdateWithoutRelationshipsToInput>
    create: XOR<MemberCreateWithoutRelationshipsToInput, MemberUncheckedCreateWithoutRelationshipsToInput>
    where?: MemberWhereInput
  }

  export type MemberUpdateToOneWithWhereWithoutRelationshipsToInput = {
    where?: MemberWhereInput
    data: XOR<MemberUpdateWithoutRelationshipsToInput, MemberUncheckedUpdateWithoutRelationshipsToInput>
  }

  export type MemberUpdateWithoutRelationshipsToInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUpdateManyWithoutMemberNestedInput
    wallet?: WalletUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUpdateManyWithoutMemberANestedInput
  }

  export type MemberUncheckedUpdateWithoutRelationshipsToInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: MemberRoleUncheckedUpdateManyWithoutMemberNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutMemberNestedInput
    transactionsSent?: TransactionUncheckedUpdateManyWithoutSenderNestedInput
    transactionsReceived?: TransactionUncheckedUpdateManyWithoutRecipientNestedInput
    rewardsSent?: RewardUncheckedUpdateManyWithoutSenderNestedInput
    rewardsReceived?: RewardUncheckedUpdateManyWithoutRecipientNestedInput
    evaluationsGiven?: EvaluationUncheckedUpdateManyWithoutCuratorNestedInput
    relationshipsFrom?: RelationshipStrengthUncheckedUpdateManyWithoutMemberANestedInput
  }

  export type MemberRoleCreateManyMemberInput = {
    id?: string
    role: $Enums.Role
  }

  export type TransactionCreateManySenderInput = {
    id?: string
    recipientId: string
    amount: number
    currency?: string
    note?: string | null
    isPrivate?: boolean
    createdAt?: Date | string
  }

  export type TransactionCreateManyRecipientInput = {
    id?: string
    senderId: string
    amount: number
    currency?: string
    note?: string | null
    isPrivate?: boolean
    createdAt?: Date | string
  }

  export type RewardCreateManySenderInput = {
    id?: string
    recipientId: string
    amount: number
    currency?: string
    note?: string | null
    isRecurring?: boolean
    createdAt?: Date | string
  }

  export type RewardCreateManyRecipientInput = {
    id?: string
    senderId: string
    amount: number
    currency?: string
    note?: string | null
    isRecurring?: boolean
    createdAt?: Date | string
  }

  export type EvaluationCreateManyCuratorInput = {
    id?: string
    subject: string
    note?: string | null
    createdAt?: Date | string
  }

  export type RelationshipStrengthCreateManyMemberAInput = {
    id?: string
    memberBId: string
    strength?: number
  }

  export type RelationshipStrengthCreateManyMemberBInput = {
    id?: string
    memberAId: string
    strength?: number
  }

  export type MemberRoleUpdateWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
  }

  export type MemberRoleUncheckedUpdateWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
  }

  export type MemberRoleUncheckedUpdateManyWithoutMemberInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
  }

  export type TransactionUpdateWithoutSenderInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recipient?: MemberUpdateOneRequiredWithoutTransactionsReceivedNestedInput
  }

  export type TransactionUncheckedUpdateWithoutSenderInput = {
    id?: StringFieldUpdateOperationsInput | string
    recipientId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyWithoutSenderInput = {
    id?: StringFieldUpdateOperationsInput | string
    recipientId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUpdateWithoutRecipientInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: MemberUpdateOneRequiredWithoutTransactionsSentNestedInput
  }

  export type TransactionUncheckedUpdateWithoutRecipientInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyWithoutRecipientInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RewardUpdateWithoutSenderInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isRecurring?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recipient?: MemberUpdateOneRequiredWithoutRewardsReceivedNestedInput
  }

  export type RewardUncheckedUpdateWithoutSenderInput = {
    id?: StringFieldUpdateOperationsInput | string
    recipientId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isRecurring?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RewardUncheckedUpdateManyWithoutSenderInput = {
    id?: StringFieldUpdateOperationsInput | string
    recipientId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isRecurring?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RewardUpdateWithoutRecipientInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isRecurring?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: MemberUpdateOneRequiredWithoutRewardsSentNestedInput
  }

  export type RewardUncheckedUpdateWithoutRecipientInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isRecurring?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RewardUncheckedUpdateManyWithoutRecipientInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    isRecurring?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EvaluationUpdateWithoutCuratorInput = {
    id?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EvaluationUncheckedUpdateWithoutCuratorInput = {
    id?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EvaluationUncheckedUpdateManyWithoutCuratorInput = {
    id?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RelationshipStrengthUpdateWithoutMemberAInput = {
    id?: StringFieldUpdateOperationsInput | string
    strength?: FloatFieldUpdateOperationsInput | number
    memberB?: MemberUpdateOneRequiredWithoutRelationshipsToNestedInput
  }

  export type RelationshipStrengthUncheckedUpdateWithoutMemberAInput = {
    id?: StringFieldUpdateOperationsInput | string
    memberBId?: StringFieldUpdateOperationsInput | string
    strength?: FloatFieldUpdateOperationsInput | number
  }

  export type RelationshipStrengthUncheckedUpdateManyWithoutMemberAInput = {
    id?: StringFieldUpdateOperationsInput | string
    memberBId?: StringFieldUpdateOperationsInput | string
    strength?: FloatFieldUpdateOperationsInput | number
  }

  export type RelationshipStrengthUpdateWithoutMemberBInput = {
    id?: StringFieldUpdateOperationsInput | string
    strength?: FloatFieldUpdateOperationsInput | number
    memberA?: MemberUpdateOneRequiredWithoutRelationshipsFromNestedInput
  }

  export type RelationshipStrengthUncheckedUpdateWithoutMemberBInput = {
    id?: StringFieldUpdateOperationsInput | string
    memberAId?: StringFieldUpdateOperationsInput | string
    strength?: FloatFieldUpdateOperationsInput | number
  }

  export type RelationshipStrengthUncheckedUpdateManyWithoutMemberBInput = {
    id?: StringFieldUpdateOperationsInput | string
    memberAId?: StringFieldUpdateOperationsInput | string
    strength?: FloatFieldUpdateOperationsInput | number
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}
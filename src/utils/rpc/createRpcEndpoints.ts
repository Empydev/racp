import { BaseQueryFn, FetchArgs } from "@reduxjs/toolkit/query";
import {
  EndpointBuilder,
  MutationDefinition,
  QueryDefinition,
} from "@reduxjs/toolkit/dist/query/endpointDefinitions";
import { ResponseHandler } from "@reduxjs/toolkit/dist/query/fetchBaseQuery";
import { typedKeys } from "../typedKeys";
import {
  RpcDefinitionEntry,
  RpcDefinitionEntries,
} from "./createRpcDefinition";

export function createRpcEndpoints<
  BaseQuery extends BaseQueryFn<FetchArgs>,
  TagTypes extends string,
  ReducerPath extends string,
  Entries extends RpcDefinitionEntries
>(
  builder: EndpointBuilder<BaseQuery, TagTypes, ReducerPath>,
  entries: Entries
) {
  type RPCEndpoint<T extends RpcDefinitionEntry> = {
    query: QueryDefinition<
      T["argument"]["_type"],
      BaseQuery,
      TagTypes,
      T["result"]["_type"],
      ReducerPath
    >;
    mutation: MutationDefinition<
      T["argument"]["_type"],
      BaseQuery,
      TagTypes,
      T["result"]["_type"],
      ReducerPath
    >;
  }[T["intent"]];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endpoints = {} as Record<keyof Entries, RPCEndpoint<any>>;

  for (const endpointName of typedKeys(entries)) {
    const { intent } = entries[endpointName];

    endpoints[endpointName] = builder[intent](
      {
        query: (arg: unknown) => {
          const args: FetchArgs = {
            url: createEndpointUrl(endpointName),
            method: "post",
            body: JSON.stringify(arg),
            responseHandler,
          };
          return args;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any // Sad assert since I can't make EndpointBuilder accept this
    );
  }

  return endpoints as {
    [K in keyof Entries]: RPCEndpoint<Entries[K]>;
  };
}

export const createEndpointUrl = String;

const responseHandler: ResponseHandler = async (res) => {
  const text = await res.text();
  if (res.status !== 200) {
    return { error: text || res.statusText };
  }
  return text.length > 0 ? JSON.parse(text) : undefined;
};

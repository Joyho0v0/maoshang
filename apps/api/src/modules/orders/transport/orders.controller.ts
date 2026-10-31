import { Body, Controller, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { formatEtag } from '../../../common/http/etag.js';
import { etagVersion, principalOf, problemForBackend, queryRecord, queryString, queryStrings, requestIdOf, transactionOf, type BackendRequest } from '../../../common/http/backend-controller.js';
import { OrdersService, type OrderRecord } from '../application/orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  async list(@Req() request: BackendRequest): Promise<unknown> {
    try {
      const query = queryRecord(request);
      const filters: { after?: string; size?: number; sort?: string; statuses?: readonly string[] } = {};
      const after = queryString(query, 'page[after]');
      const size = queryString(query, 'page[size]');
      const sort = queryString(query, 'sort');
      const statuses = queryStrings(query, 'filter[status]');
      if (after !== undefined) filters.after = after;
      if (size !== undefined) filters.size = Number(size);
      if (sort !== undefined) filters.sort = sort;
      if (statuses !== undefined) filters.statuses = statuses;
      const page = await this.service.listOrders(principalOf(request), filters, requestIdOf(request));
      return { data: page.data.map(toOrderApi), page: page.page };
    } catch (error) {
      throw problemForBackend(error, request);
    }
  }

  @Post()
  async create(@Req() request: BackendRequest, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const order = await this.service.createOrder(principalOf(request), body as never, requestIdOf(request), transactionOf(request));
      const href = `/api/v1/orders/${order.id}`;
      reply.code(201).header('etag', formatEtag(order.version)).header('location', href).header('content-location', href).header('cache-control', 'no-store');
      return toOrderApi(order);
    } catch (error) {
      throw problemForBackend(error, request);
    }
  }

  @Get(':id')
  async get(@Req() request: BackendRequest, @Param('id') id: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const order = await this.service.getOrder(principalOf(request), id, requestIdOf(request));
      reply.header('etag', formatEtag(order.version)).header('cache-control', 'no-store');
      return toOrderApi(order);
    } catch (error) {
      throw problemForBackend(error, request, `/api/v1/orders/${id}`);
    }
  }

  @Patch(':id')
  async update(@Req() request: BackendRequest, @Param('id') id: string, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const order = await this.service.updateOrder(principalOf(request), id, etagVersion(request), body as never, requestIdOf(request), transactionOf(request));
      reply.header('etag', formatEtag(order.version)).header('content-location', `/api/v1/orders/${id}`).header('cache-control', 'no-store');
      return toOrderApi(order);
    } catch (error) {
      throw problemForBackend(error, request, `/api/v1/orders/${id}`);
    }
  }

  @Post(':id/transitions')
  async transition(@Req() request: BackendRequest, @Param('id') id: string, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const order = await this.service.transitionOrder(principalOf(request), id, etagVersion(request), body as never, requestIdOf(request), transactionOf(request));
      reply.code(200).header('etag', formatEtag(order.version)).header('content-location', `/api/v1/orders/${id}`).header('cache-control', 'no-store');
      return toOrderApi(order);
    } catch (error) {
      throw problemForBackend(error, request, `/api/v1/orders/${id}`);
    }
  }
}

function toOrderApi(value: OrderRecord): Record<string, unknown> {
  return {
    id: value.id,
    organizationId: value.organizationId,
    version: value.version,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    customerId: value.customerId,
    orderNo: value.orderNo,
    currency: value.currency,
    status: value.status,
    lines: value.lines.map((line) => ({ skuId: line.skuId, quantity: line.quantity, unitPrice: line.unitPrice })),
    totalAmount: value.totalAmount,
    ...(value.metadata === undefined ? {} : { metadata: value.metadata }),
    ...(value.stage === undefined ? {} : { stage: value.stage }),
    ...(value.capabilities === undefined ? {} : { capabilities: value.capabilities }),
    ...(value.allowedTransitions === undefined ? {} : { allowedTransitions: value.allowedTransitions }),
  };
}

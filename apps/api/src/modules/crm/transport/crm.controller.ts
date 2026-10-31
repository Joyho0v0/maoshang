import { Body, Controller, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { formatEtag } from '../../../common/http/etag.js';
import { principalOf, problemForBackend, queryRecord, queryString, queryStrings, requestIdOf, transactionOf, etagVersion, type BackendRequest } from '../../../common/http/backend-controller.js';
import { toCustomerApi, CrmService, type CustomerFilters } from '../application/crm.service.js';

@Controller('customers')
export class CrmController {
  constructor(private readonly service: CrmService) {}

  @Get()
  async list(@Req() request: BackendRequest): Promise<unknown> {
    try {
      const query = queryRecord(request);
      const filters: CustomerFilters = {};
      const after = queryString(query, 'page[after]');
      const size = queryString(query, 'page[size]');
      const sort = queryString(query, 'sort');
      const statuses = queryStrings(query, 'filter[status]');
      const groupIds = queryStrings(query, 'filter[groupId]');
      const ownerIds = queryStrings(query, 'filter[ownerUserId]');
      if (after !== undefined) filters.after = after;
      if (size !== undefined) filters.size = Number(size);
      if (sort !== undefined) filters.sort = sort;
      if (statuses !== undefined) filters.statuses = statuses;
      if (groupIds !== undefined) filters.groupIds = groupIds;
      if (ownerIds !== undefined) filters.ownerIds = ownerIds;
      const principal = principalOf(request);
      const page = await this.service.listCustomers(principal, filters);
      return { data: page.data.map((customer) => toCustomerApi(customer, principal)), page: page.page };
    } catch (error) {
      throw problemForBackend(error, request);
    }
  }

  @Post()
  async create(@Req() request: BackendRequest, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const principal = principalOf(request);
      const customer = await this.service.createCustomer(principal, body as never, requestIdOf(request), transactionOf(request));
      const href = `/api/v1/customers/${customer.id}`;
      reply.code(201).header('etag', formatEtag(customer.version)).header('location', href).header('content-location', href).header('cache-control', 'no-store');
      return toCustomerApi(customer, principal);
    } catch (error) {
      throw problemForBackend(error, request);
    }
  }

  @Get(':id')
  async get(@Req() request: BackendRequest, @Param('id') id: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const principal = principalOf(request);
      const customer = await this.service.getCustomer(principal, id);
      reply.header('etag', formatEtag(customer.version)).header('cache-control', 'no-store');
      return toCustomerApi(customer, principal);
    } catch (error) {
      throw problemForBackend(error, request, `/api/v1/customers/${id}`);
    }
  }

  @Patch(':id')
  async update(@Req() request: BackendRequest, @Param('id') id: string, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const principal = principalOf(request);
      const customer = await this.service.updateCustomer(principal, id, etagVersion(request), body as never, requestIdOf(request), transactionOf(request));
      const href = `/api/v1/customers/${id}`;
      reply.header('etag', formatEtag(customer.version)).header('content-location', href).header('cache-control', 'no-store');
      return toCustomerApi(customer, principal);
    } catch (error) {
      throw problemForBackend(error, request, `/api/v1/customers/${id}`);
    }
  }

  @Post(':id/submit-approval')
  submitApproval(@Req() request: BackendRequest, @Param('id') id: string, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    return this.command(request, id, { ...body, action: 'SUBMIT_APPROVAL' }, reply);
  }

  @Post(':id/approve')
  approve(@Req() request: BackendRequest, @Param('id') id: string, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    return this.command(request, id, { ...body, action: 'APPROVE' }, reply);
  }

  @Post(':id/reject')
  reject(@Req() request: BackendRequest, @Param('id') id: string, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    return this.command(request, id, { ...body, action: 'REJECT' }, reply);
  }

  @Post(':id/reassign')
  reassign(@Req() request: BackendRequest, @Param('id') id: string, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    return this.command(request, id, { ...body, action: 'REASSIGN' }, reply);
  }

  private async command(request: BackendRequest, id: string, body: Record<string, unknown>, reply: FastifyReply): Promise<unknown> {
    try {
      const principal = principalOf(request);
      const customer = await this.service.commandCustomer(principal, id, etagVersion(request), body as never, requestIdOf(request), transactionOf(request));
      reply.code(200).header('etag', formatEtag(customer.version)).header('content-location', `/api/v1/customers/${id}`).header('cache-control', 'no-store');
      return toCustomerApi(customer, principal);
    } catch (error) {
      throw problemForBackend(error, request, `/api/v1/customers/${id}`);
    }
  }
}

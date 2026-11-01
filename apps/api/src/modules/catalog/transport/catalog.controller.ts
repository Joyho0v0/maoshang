import { Body, Controller, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { formatEtag } from '../../../common/http/etag.js';
import { etagVersion, principalOf, problemForBackend, queryRecord, queryString, queryStrings, requestIdOf, transactionOf, type BackendRequest } from '../../../common/http/backend-controller.js';
import { CatalogService, type ProductRecord, type SkuRecord } from '../application/catalog.service.js';

@Controller()
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Get('products')
  async listProducts(@Req() request: BackendRequest): Promise<unknown> {
    try {
      const query = queryRecord(request);
      const page = await this.service.listProducts(principalOf(request), listFilters(query), requestIdOf(request));
      return { data: page.data.map(toProductApi), page: page.page };
    } catch (error) {
      throw problemForBackend(error, request);
    }
  }

  @Post('products')
  async createProduct(@Req() request: BackendRequest, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const principal = principalOf(request);
      const product = await this.service.createProduct(principal, body as never, requestIdOf(request), transactionOf(request));
      const href = `/api/v1/products/${product.id}`;
      reply.code(201).header('etag', formatEtag(product.version)).header('location', href).header('content-location', href).header('cache-control', 'no-store');
      return toProductApi(product);
    } catch (error) {
      throw problemForBackend(error, request);
    }
  }

  @Get('products/:id')
  async getProduct(@Req() request: BackendRequest, @Param('id') id: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const product = await this.service.getProduct(principalOf(request), id, requestIdOf(request));
      reply.header('etag', formatEtag(product.version)).header('cache-control', 'no-store');
      return toProductApi(product);
    } catch (error) {
      throw problemForBackend(error, request, `/api/v1/products/${id}`);
    }
  }

  @Patch('products/:id')
  async updateProduct(@Req() request: BackendRequest, @Param('id') id: string, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const product = await this.service.updateProduct(principalOf(request), id, etagVersion(request), body as never, requestIdOf(request), transactionOf(request));
      reply.header('etag', formatEtag(product.version)).header('content-location', `/api/v1/products/${id}`).header('cache-control', 'no-store');
      return toProductApi(product);
    } catch (error) {
      throw problemForBackend(error, request, `/api/v1/products/${id}`);
    }
  }

  @Get('skus')
  async listSkus(@Req() request: BackendRequest): Promise<unknown> {
    try {
      const query = queryRecord(request);
      const page = await this.service.listSkus(principalOf(request), listFilters(query), requestIdOf(request));
      return { data: page.data.map(toSkuApi), page: page.page };
    } catch (error) {
      throw problemForBackend(error, request);
    }
  }

  @Post('skus')
  async createSku(@Req() request: BackendRequest, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const sku = await this.service.createSku(principalOf(request), body as never, requestIdOf(request), transactionOf(request));
      const href = `/api/v1/skus/${sku.id}`;
      reply.code(201).header('etag', formatEtag(sku.version)).header('location', href).header('content-location', href).header('cache-control', 'no-store');
      return toSkuApi(sku);
    } catch (error) {
      throw problemForBackend(error, request);
    }
  }

  @Get('skus/:id')
  async getSku(@Req() request: BackendRequest, @Param('id') id: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const sku = await this.service.getSku(principalOf(request), id, requestIdOf(request));
      reply.header('etag', formatEtag(sku.version)).header('cache-control', 'no-store');
      return toSkuApi(sku);
    } catch (error) {
      throw problemForBackend(error, request, `/api/v1/skus/${id}`);
    }
  }

  @Patch('skus/:id')
  async updateSku(@Req() request: BackendRequest, @Param('id') id: string, @Body() body: Record<string, unknown>, @Res({ passthrough: true }) reply: FastifyReply): Promise<unknown> {
    try {
      const sku = await this.service.updateSku(principalOf(request), id, etagVersion(request), body as never, requestIdOf(request), transactionOf(request));
      reply.header('etag', formatEtag(sku.version)).header('content-location', `/api/v1/skus/${id}`).header('cache-control', 'no-store');
      return toSkuApi(sku);
    } catch (error) {
      throw problemForBackend(error, request, `/api/v1/skus/${id}`);
    }
  }
}

function listFilters(query: Record<string, unknown>): { after?: string; size?: number; sort?: string; statuses?: readonly string[] } {
  const after = queryString(query, 'page[after]');
  const size = queryString(query, 'page[size]');
  const sort = queryString(query, 'sort');
  const statuses = queryStrings(query, 'filter[status]');
  return { ...(after === undefined ? {} : { after }), ...(size === undefined ? {} : { size: Number(size) }), ...(sort === undefined ? {} : { sort }), ...(statuses === undefined ? {} : { statuses }) };
}

function toProductApi(value: ProductRecord): Record<string, unknown> {
  return { ...value, ...(value.description === undefined ? {} : { description: value.description }), ...(value.categoryId === undefined ? {} : { categoryId: value.categoryId }) };
}

function toSkuApi(value: SkuRecord): Record<string, unknown> {
  return { ...value, ...(value.price === undefined ? {} : { price: value.price }) };
}

/**
 * 统一的请求路由中间件
 * 同时支持 Cloudflare Workers 和 Pages 部署
 */

// 导入所有 API 处理器
import * as apiChildren from "./api/children/[[path]]";
import * as apiWrite from "./api/write/items/[[path]]";
import * as apiBuckets from "./api/buckets";
import * as rawFile from "./raw/[[path]]";

export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // ==================== API 路由 ====================

    // GET /api/buckets - 获取存储桶信息
    if (pathname === "/api/buckets") {
      return await apiBuckets.onRequestGet?.({
        request,
        env,
        params: {},
      }) || notFound();
    }

    // GET /api/children/:path - 列表文件/文件夹
    if (pathname.startsWith("/api/children/")) {
      const path = pathname.replace("/api/children/", "");
      const pathParams = path ? path.split("/").filter(Boolean) : [];
      return await apiChildren.onRequestGet?.({
        request,
        env,
        params: { path: pathParams },
      }) || notFound();
    }

    // /api/write/items/:path - 文件上传、删除、移动
    if (pathname.startsWith("/api/write/items/")) {
      const path = pathname.replace("/api/write/items/", "");
      const pathParams = path ? path.split("/").filter(Boolean) : [];
      const ctx = { request, env, params: { path: pathParams } };

      if (request.method === "PUT") {
        return await apiWrite.onRequestPut?.(ctx) || notFound();
      } else if (request.method === "POST") {
        return await apiWrite.onRequestPost?.(ctx) || notFound();
      } else if (request.method === "DELETE") {
        return await apiWrite.onRequestDelete?.(ctx) || notFound();
      }
    }

    // GET /raw/:path - 读取原始文件
    if (pathname.startsWith("/raw/")) {
      const path = pathname.replace("/raw/", "");
      const pathParams = path ? path.split("/").filter(Boolean) : [];
      return await rawFile.onRequestGet?.({
        request,
        env,
        params: { path: pathParams },
      }) || notFound();
    }

    // ==================== 静态文件处理 ====================
    // 让 Pages/Workers 原生处理静态文件和 SPA 路由
    // 如果 context.next 存在（Pages），调用它
    if (context.next && typeof context.next === "function") {
      return context.next();
    }

    // 对于 Workers，返回 404（因为静态文件不存在）
    return notFound();
  } catch (error: any) {
    console.error("[Middleware Error]", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

function notFound() {
  return new Response(
    JSON.stringify({ error: "Not Found" }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}




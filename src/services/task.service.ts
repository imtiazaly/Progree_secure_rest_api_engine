import { Prisma, Role, TaskStatus, Priority } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

interface CurrentUser {
  id: string;
  email: string;
  role: Role;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
}

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string | null;
}

interface QueryTasksInput {
  page: number;
  limit: number;
  status?: TaskStatus;
  priority?: Priority;
  search?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export class TaskService {
  static async createTask(data: CreateTaskInput, user: CurrentUser) {
    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        userId: user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  static async getTasks(query: QueryTasksInput, user: CurrentUser) {
    const { page, limit, status, priority, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      isDeleted: false,
      ...(user.role !== Role.ADMIN && { userId: user.id }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      tasks,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async getTaskById(id: string, user: CurrentUser) {
    const task = await prisma.task.findFirst({
      where: { id, isDeleted: false },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    if (user.role !== Role.ADMIN && task.userId !== user.id) {
      throw new ApiError(403, "Forbidden: You do not have access to this task");
    }

    return task;
  }

  static async updateTask(
    id: string,
    data: UpdateTaskInput,
    user: CurrentUser,
  ) {
    await this.getTaskById(id, user); // Verify existence & authorization

    return prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async deleteTask(id: string, user: CurrentUser) {
    await this.getTaskById(id, user); // Verify existence & authorization

    // Secure Soft-Delete (Audit preservation)
    await prisma.task.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { id, message: "Task successfully deleted" };
  }
}

import { logger } from "@/utils/logger";

type QueueTask = {
  name: string;
  run: () => Promise<unknown>;
  resolve?: (value: unknown) => void;
  reject?: (reason?: unknown) => void;
};

const taskQueue: QueueTask[] = [];
let isRunning = false;

async function processQueue(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  while (taskQueue.length > 0) {
    const task = taskQueue.shift();
    if (!task) continue;

    try {
      const value = await task.run();
      if (task.resolve) task.resolve(value);
      logger.info(`[Queue] Completed task: ${task.name}`);
    } catch (error: any) {
      if (task.reject) task.reject(error);
      logger.error(`[Queue] Failed task ${task.name}:`, {
        message: error?.message || String(error),
      });
    }
  }

  isRunning = false;
}

export function enqueueTask(name: string, run: () => Promise<void>): void {
  taskQueue.push({ name, run: async () => run() });
  setImmediate(() => {
    void processQueue();
  });
}

export function enqueueTaskWithResult<T>(
  name: string,
  run: () => Promise<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    taskQueue.push({
      name,
      run: async () => run(),
      resolve: (value) => resolve(value as T),
      reject,
    });

    setImmediate(() => {
      void processQueue();
    });
  });
}

export function getQueueStats(): { queued: number; running: boolean } {
  return {
    queued: taskQueue.length,
    running: isRunning,
  };
}

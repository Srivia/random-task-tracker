import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('random');
  timerDisplayText = signal('00:00:00');
  private timerId: any;
  resumeState = signal(false);
  private secondsLapsed: number = 0;
  // tasks = signal(new Map<string, Tasks>());
  currentTaskName = signal<string>('');

  currentInterationId: number | null = null;
  isTimerOn = signal<boolean>(false);

  tasks = signal<Task[]>([]);

  startTimer() {
    clearInterval(this.timerId);

    this.timerId = setInterval(() => {
      this.secondsLapsed++;

      const hours = Math.floor(this.secondsLapsed / 3600);
      const minutes = Math.floor((this.secondsLapsed % 3600) / 60);
      const seconds = this.secondsLapsed % 60;

      let displayText =
        String(hours).padStart(2, '0') +
        ':' +
        String(minutes).padStart(2, '0') +
        ':' +
        String(seconds).padStart(2, '0');

      this.timerDisplayText.set(displayText);
    }, 1000);
  }

  clearTimer() {
    clearInterval(this.timerId);
    this.secondsLapsed = 0;
    this.timerDisplayText.set('00:00:00');
    // this.resumeState.set(true);
  }

  // restartTimer() {
  //   this.resumeState.set(false);
  //   this.secondsLapsed = 0;
  //   this.startTimer();
  // }

  startTask() {
    const taskName = this.currentTaskName().trim();
    if (!taskName) return;

    this.startTimer();

    const utcNow = new Date().toISOString();

    this.isTimerOn.set(true);

    this.tasks.update((tasks) => {
      const existingTask = tasks.find((task) => task.taskName === taskName);

      const updatedTasks = existingTask
        ? tasks.map((task) =>
            task.taskName === taskName
              ? {
                  ...task,
                  taskCount: task.timeEntries.length + 1,
                  updatedAt: utcNow,
                  timeEntries: [
                    {
                      startTime: utcNow,
                      endTime: '',
                      timeLapsed: '-',
                    },
                    ...task.timeEntries,
                  ],
                }
              : task,
          )
        : [
            {
              taskName,
              taskCount: 1,
              updatedAt: utcNow,
              timeEntries: [
                {
                  startTime: utcNow,
                  endTime: '',
                  timeLapsed: '-',
                },
              ],
            },
            ...tasks,
          ];

      return updatedTasks.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    });
  }
  stopTask() {
    this.clearTimer();
    const utcNow: string = new Date().toISOString();
    this.isTimerOn.set(false);

    this.tasks.update((tasks) => {
      return tasks.map((task) => {
        return task.taskName == this.currentTaskName()
          ? {
              ...task,
              updatedAt: utcNow,
              timeEntries: [
                {
                  ...task.timeEntries[0],
                  endTime: utcNow,
                  timeLapsed: this.getElapsedTime(task.timeEntries[0].startTime, utcNow),
                },
                ...task.timeEntries.slice(1),
              ],
            }
          : task;
      });
    });
  }
  toggleTask() {
    if (this.isTimerOn()) {
      this.stopTask();
    } else {
      this.startTask();
    }
  }

  getElapsedTime(startTime: string, endTime: string): string {
    const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();

    const totalSeconds = Math.floor(diffMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return (
      String(hours).padStart(2, '0') +
      ':' +
      String(minutes).padStart(2, '0') +
      ':' +
      String(seconds).padStart(2, '0')
    );
  }

  deleteTimeEntry(task: Task, index: number) {
    if (task.timeEntries[index].timeLapsed == '-') {
      this.stopTask();
    }

    this.tasks.update((tasks) =>
      tasks.map((item) =>
        item.taskName === task.taskName
          ? {
              ...item,
              timeEntries: item.timeEntries.filter((_, i) => i != index),
              taskCount: item.timeEntries.length - 1,
            }
          : item,
      ),
    );
  }

  deleteTask(index: number) {
    const task = this.tasks()[index];

    if (task.taskName == this.currentTaskName()) {
      this.stopTask();
    }
    this.tasks.update((tasks) => tasks.filter((item) => item.taskName != task.taskName));
  }
}

type Task = {
  taskName: string;
  taskCount: number;
  timeEntries: TimeEntry[];
  updatedAt: string;
};
type TimeEntry = {
  startTime: string;
  endTime: string;
  timeLapsed: string;
};

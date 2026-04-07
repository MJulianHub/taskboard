module Api
  class DashboardController < ApplicationController
    before_action :authenticate_user!

    def index
      all_tasks = current_user.all_tasks

      render json: {
        projects_count: current_user.projects.count,
        tasks_count: all_tasks.count,
        pending_tasks_count: all_tasks.where(status: :pending).count,
        in_progress_tasks_count: all_tasks.where(status: :in_progress).count,
        completed_tasks_count: all_tasks.where(status: :done).count,
        overdue_tasks_count: all_tasks.where(status: :overdue).count
      }, status: :ok
    end
  end
end

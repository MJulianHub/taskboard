class DashboardController < ApplicationController
  before_action :authenticate_user!

  def index
    render json: {
      projects_count: current_user.projects.count,
      tasks_count: current_user.tasks.count,
      pending_tasks_count: current_user.tasks.where(status: "pending").count,
      in_progress_tasks_count: current_user.tasks.where(status: "in_progress").count,
      completed_tasks_count: current_user.tasks.where(status: "done").count,
      overdue_tasks_count: current_user.tasks.where(status: "overdue").count
    }
  end
end

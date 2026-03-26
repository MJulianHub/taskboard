class DashboardController < ApplicationController
  before_action :authenticate_user!

  def index
    render json: {
      projects_count: current_user.projects.count,
      tasks_count: current_user.tasks.count,
      pending_tasks_count: current_user.tasks.where(status: "pending").count,
      completed_tasks_count: current_user.tasks.where(status: "completed").count
    }
  end
end

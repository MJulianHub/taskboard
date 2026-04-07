module Api
  class TasksController < ApplicationController
    before_action :authenticate_user!
    before_action :set_project
    before_action :authorize_user!
    before_action :set_task, only: [:update]

    def index
      @tasks = @project.tasks.includes(:user)
      render json: @tasks, methods: [:updated_at], include: { user: { only: [:id, :email, :first_name, :last_name] } }
    end

    def create
      @task = @project.tasks.new(task_params_without_date)
      @task.user = User.find_by(id: params[:task][:user_id]) if params[:task][:user_id].present?
      @task.due_date = parse_date(params[:task][:due_date]) if params[:task][:due_date].present?

      if @task.save
        render json: @task, status: :created, include: { user: { only: [:id, :email, :first_name, :last_name] } }
      else
        render json: @task.errors, status: :unprocessable_entity
      end
    end

    def update
      if params[:task][:user_id].present?
        @task.user = User.find_by(id: params[:task][:user_id])
      elsif params[:task][:user_id] == ""
        @task.user = nil
      end

      if params[:task][:due_date].present?
        @task.due_date = parse_date(params[:task][:due_date])
      end

      if @task.update(task_params_without_date)
        render json: @task, include: { user: { only: [:id, :email, :first_name, :last_name] } }
      else
        render json: @task.errors, status: :unprocessable_entity
      end
    end

    private

    def set_project
      @project = Project.find(params[:project_id])
    end

    def authorize_user!
      return if @project.users.include?(current_user)
      render json: { error: "No autorizado" }, status: :forbidden
    end

    def set_task
      @task = @project.tasks.find(params[:id])
    end

    def task_params_without_date
      params.require(:task).permit(:title, :status, :user_id)
    end

    def parse_date(date_string)
      Date.strptime(date_string, "%Y-%m-%d")
    end
  end
end

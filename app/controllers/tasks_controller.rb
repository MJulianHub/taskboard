class TasksController < ApplicationController
  before_action :authenticate_user!
  before_action :set_project
  before_action :authorize_user!
  before_action :set_task, only: [:update]

  def index
    @tasks = @project.tasks.includes(:user)
    respond_to do |format|
      format.html
      format.json { render json: @tasks, include: { user: { only: [:id, :email, :first_name, :last_name] } } }
    end
  end

  def create
    @task = @project.tasks.new(task_params)
    @task.user = User.find_by(id: params[:task][:user_id]) if params[:task][:user_id].present?

    if @task.save
      respond_to do |format|
        format.html { redirect_to project_tasks_path(@project) }
        format.json { render json: @task, status: :created, include: { user: { only: [:id, :email, :first_name, :last_name] } } }
      end
    else
      respond_to do |format|
        format.html { render :index }
        format.json { render json: @task.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    if params[:task][:user_id].present?
      @task.user = User.find_by(id: params[:task][:user_id])
    elsif params[:task][:user_id] == ""
      @task.user = nil
    end

    if @task.update(task_params.except(:user_id))
      render json: @task, include: { user: { only: [:id, :email, :first_name, :last_name] } }
    else
      respond_to do |format|
        format.html { render :index }
        format.json { render json: @task.errors, status: :unprocessable_entity }
      end
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

  def task_params
    params.require(:task).permit(:title, :status, :due_date, :user_id)
  end
end

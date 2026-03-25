class ProjectsController < ApplicationController
  before_action :authenticate_user!

  def index
    @projects = current_user.projects.includes(:users)
    respond_to do |format|
      format.html
      format.json { render json: @projects }
    end
  end

  def create
    @project = Project.new(project_params)

    if @project.save
      ProjectMembership.create!(user: current_user, project: @project)
      respond_to do |format|
        format.html { redirect_to @project }
        format.json { render json: @project, status: :created }
      end
    else
      respond_to do |format|
        format.html { render :new }
        format.json { render json: @project.errors, status: :unprocessable_entity }
      end
    end
  end

  private

  def project_params
    params.require(:project).permit(:name, :description)
  end
end

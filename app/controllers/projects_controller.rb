class ProjectsController < ApplicationController
    before_action :authenticate_user!

  def index
    projects = current_user.projects
    render json: projects
  end

  def create
    project = Project.new(project_params)

    if project.save
      # crear membresía automáticamente
      ProjectMembership.create!(user: current_user, project: project)

      render json: project, status: :created
    else
      render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def project_params
    params.require(:project).permit(:name, :description)
  end

end

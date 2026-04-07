module Api
  class ProjectsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_project, only: [:show, :add_member, :remove_member]
    before_action :authorize_user!, only: [:show, :add_member, :remove_member]

    def index
      @projects = current_user.projects.includes(:users, :tasks, :owner)
      render json: @projects, methods: [:tasks_count], include: {
        owner: { only: [:id, :first_name, :last_name] },
        users: { only: [:id, :first_name, :last_name] }
      }
    end

    def show
      @project = Project.includes(:users, :owner).find(params[:id])
      render json: @project, include: {
        owner: { only: [:id, :first_name, :last_name] },
        users: { only: [:id, :first_name, :last_name] }
      }
    end

    def create
      @project = Project.new(project_params)
      @project.owner = current_user

      if @project.save
        ProjectMembership.create!(user: current_user, project: @project)
        render json: @project, status: :created
      else
        render json: @project.errors, status: :unprocessable_entity
      end
    end

    def add_member
      return render json: { error: "Only owner can add members" }, status: :forbidden unless @project.owner == current_user

      user = User.find_by(id: params[:user_id])
      return render json: { error: "User not found" }, status: :not_found unless user

      if @project.users.include?(user)
        return render json: { error: "User is already a member" }, status: :unprocessable_entity
      end

      ProjectMembership.create!(user: user, project: @project)
      render json: user, status: :created
    end

    def remove_member
      return render json: { error: "Only owner can remove members" }, status: :forbidden unless @project.owner == current_user

      user = User.find_by(id: params[:user_id])
      return render json: { error: "User not found" }, status: :not_found unless user

      return render json: { error: "Cannot remove owner" }, status: :unprocessable_entity if @project.owner == user

      membership = ProjectMembership.find_by(user: user, project: @project)
      return render json: { error: "User is not a member" }, status: :not_found unless membership

      membership.destroy
      head :no_content
    end

    private

    def set_project
      @project = Project.find(params[:id])
    end

    def authorize_user!
      return if @project.users.include?(current_user)
      render json: { error: "No autorizado" }, status: :forbidden
    end

    def project_params
      params.require(:project).permit(:name, :description)
    end
  end
end

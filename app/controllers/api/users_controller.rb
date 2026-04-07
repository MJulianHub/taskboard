module Api
  class UsersController < ApplicationController
    before_action :authenticate_user!

    def search
      query = params[:q]&.downcase
      project_id = params[:project_id]

      users = User.search(query).where.not(id: current_user.id)

      if project_id.present?
        project = Project.find_by(id: project_id)
        if project && project.owner == current_user
          users = users.where.not(id: project.users.select(:id))
        end
      end

      render json: users.limit(10), only: [:id, :email, :first_name, :last_name]
    end
  end
end

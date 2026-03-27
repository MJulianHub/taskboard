class UsersController < ApplicationController
  before_action :authenticate_user!

  def search
    query = params[:q]&.downcase
    users = User.where("LOWER(email) LIKE ? OR LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?", "%#{query}%", "%#{query}%", "%#{query}%")
                .where.not(id: current_user.id)
                .limit(10)
    render json: users, only: [:id, :email, :first_name, :last_name]
  end
end

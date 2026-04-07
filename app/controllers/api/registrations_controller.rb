module Api
  class RegistrationsController < ApplicationController
    def create
      user_params = params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name)

      user = User.new(user_params)

      if user.save
        render json: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
          },
          token: user.token
        }, status: :created
      else
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end
end

module Api
  class SessionsController < ApplicationController
    def create
      user_params = params.require(:user).permit(:email, :password)
      user = User.find_by(email: user_params[:email])

      if user&.valid_password?(user_params[:password])
        render json: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
          },
          token: user.token
        }
      else
        render json: { error: "Invalid email or password" }, status: :unauthorized
      end
    end

    def destroy
      render json: { message: "Logged out successfully" }, status: :ok
    end
  end
end

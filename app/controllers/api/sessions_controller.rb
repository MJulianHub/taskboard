module Api
  class SessionsController < ApplicationController
    before_action :check_rate_limit, only: [:create]

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

    private

    def check_rate_limit
      # Simple rate limiting: max 5 attempts per IP per minute
      key = "rate_limit:login:#{request.remote_ip}"
      attempts = Rails.cache.fetch(key, expires_in: 1.minute) do
        0
      end

      if attempts >= 5
        render json: { error: "Too many login attempts. Please try again later." }, status: :too_many_requests
        return
      end

      Rails.cache.write(key, attempts + 1, expires_in: 1.minute)
    end
  end
end

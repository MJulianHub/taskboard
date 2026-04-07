module Api
  class RegistrationsController < ApplicationController
    before_action :check_rate_limit, only: [:create]

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

    private

    def check_rate_limit
      # Simple rate limiting: max 3 registrations per IP per hour
      key = "rate_limit:register:#{request.remote_ip}"
      attempts = Rails.cache.fetch(key, expires_in: 1.hour) do
        0
      end

      if attempts >= 3
        render json: { error: "Too many accounts created from this IP. Please try again later." }, status: :too_many_requests
        return
      end

      Rails.cache.write(key, attempts + 1, expires_in: 1.hour)
    end
  end
end

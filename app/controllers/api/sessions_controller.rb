module Api
  class Users::SessionsController < Devise::SessionsController
    def create
      self.resource = warden.authenticate!(auth_options)

      render json: {
        user: {
          id: current_user.id,
          email: current_user.email,
          first_name: current_user.first_name,
          last_name: current_user.last_name
        },
        token: current_user.token
      }
    end

    def respond_to_on_destroy
      render json: { message: "Logged out successfully" }, status: :ok
    end
  end
end

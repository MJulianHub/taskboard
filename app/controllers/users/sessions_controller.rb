class Users::SessionsController < Devise::SessionsController
  respond_to :json

  private

  def respond_with(current_user, _opts = {})
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

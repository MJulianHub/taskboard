class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  private

  def respond_with(current_user, _opts = {})
    if current_user.persisted?
      render json: {
        user: {
          id: current_user.id,
          email: current_user.email,
          first_name: current_user.first_name,
          last_name: current_user.last_name
        },
        token: current_user.token
      }
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end
end

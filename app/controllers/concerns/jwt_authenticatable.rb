module JwtAuthenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_with_jwt, if: -> { json_request? }
    helper_method :current_user
  end

  private

  def json_request?
    request.format.json? || request.headers["Accept"]&.include?("application/json")
  end

  def authenticate_with_jwt
    token = extract_jwt_token
    return if performed? || token.blank?

    user = User.from_jwt_token(token)
    if user
      sign_in user, event: :authentication
      @current_user = user
    else
      render_unauthorized
    end
  end

  def extract_jwt_token
    header = request.headers["Authorization"]
    header.split(" ").last if header&.starts_with?("Bearer ")
  end

  def render_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def authenticate_user!
    authenticate_with_jwt
  end

  def current_user
    @current_user || super
  end
end
